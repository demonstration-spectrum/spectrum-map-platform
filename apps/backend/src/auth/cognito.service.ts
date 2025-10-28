import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
  import { 
  CognitoIdentityProviderClient,
  InitiateAuthCommand,
  RespondToAuthChallengeCommand,
  SignUpCommand,
  ConfirmSignUpCommand,
  AdminCreateUserCommand,
  AdminUpdateUserAttributesCommand,
  AdminDisableUserCommand,
  AdminEnableUserCommand,
} from '@aws-sdk/client-cognito-identity-provider';

@Injectable()
export class CognitoService {
  private cognitoClient: CognitoIdentityProviderClient;
  private userPoolId: string;
  private clientId: string;

  constructor(private configService: ConfigService) {
    this.cognitoClient = new CognitoIdentityProviderClient({
      region: this.configService.get('AWS_REGION', 'us-east-1'),
    });
    this.userPoolId = this.configService.get('AWS_COGNITO_USER_POOL_ID');
    this.clientId = this.configService.get('AWS_COGNITO_CLIENT_ID');
  }

  async authenticateUser(email: string, password: string) {
    try {
      const command = new InitiateAuthCommand({
        AuthFlow: 'USER_PASSWORD_AUTH',
        ClientId: this.clientId,
        AuthParameters: {
          USERNAME: email,
          PASSWORD: password,
        },
      });

      const response = await this.cognitoClient.send(command);
      
      if (response.AuthenticationResult?.AccessToken) {
        // Get user attributes from the token or make another call
        return {
          sub: response.AuthenticationResult.IdToken?.split('.')[1] ? 
            JSON.parse(Buffer.from(response.AuthenticationResult.IdToken.split('.')[1], 'base64').toString()).sub : 
            null,
          email: email,
          accessToken: response.AuthenticationResult.AccessToken,
          idToken: response.AuthenticationResult.IdToken,
          refreshToken: response.AuthenticationResult.RefreshToken,
        };
      }

      return null;
    } catch (error) {
      console.error('Cognito authentication error:', error);
      return null;
    }
  }

  // Start OTP flow by initiating a CUSTOM_AUTH challenge (requires Cognito Lambda triggers to send OTP email)
  async sendOtp(email: string) {
    try {
      // Start with USER_AUTH and prefer EMAIL_OTP. Cognito will either directly return EMAIL_OTP
      // or return AvailableChallenges that we can select from.
      const initCmd = new InitiateAuthCommand({
        ClientId: this.clientId,
        AuthFlow: 'USER_AUTH',
        AuthParameters: {
          USERNAME: email,
          PREFERRED_CHALLENGE: 'EMAIL_OTP',
        },
      });

      const initResp = await this.cognitoClient.send(initCmd);

      // If Cognito immediately returned the EMAIL_OTP challenge, return session.
      if (initResp.ChallengeName === 'EMAIL_OTP') {
        return { challenge: 'EMAIL_OTP', session: initResp.Session || null };
      }

      // Some responses include an AvailableChallenges array. Check ChallengeParameters if present.
      const availableRaw = initResp.ChallengeParameters?.AvailableChallenges || initResp.ChallengeParameters?.availableChallenges;

      if (availableRaw) {
        // availableRaw may be a JSON string or comma-separated string. Try to parse.
        let available: string[] = [];
        try {
          available = Array.isArray(availableRaw) ? availableRaw : JSON.parse(availableRaw);
        } catch (e) {
          // fallback: split by comma
          available = String(availableRaw).split(',').map(s => s.trim());
        }

        if (available.includes('EMAIL_OTP')) {
          // Select EMAIL_OTP challenge
          const selectCmd = new RespondToAuthChallengeCommand({
            ClientId: this.clientId,
            ChallengeName: 'SELECT_CHALLENGE',
            ChallengeResponses: {
              USERNAME: email,
              ANSWER: 'EMAIL_OTP',
            },
            Session: initResp.Session,
          });

          const selectResp = await this.cognitoClient.send(selectCmd);
          return { challenge: selectResp.ChallengeName || 'EMAIL_OTP', session: selectResp.Session || null };
        }
      }

      // If no explicit EMAIL_OTP path, return what we received so client can decide.
      return { challenge: initResp.ChallengeName || null, session: initResp.Session || null };
    } catch (error) {
      console.error('Cognito sendOtp error:', error);
      throw error;
    }
  }

  // Verify OTP by responding to the custom auth challenge
  async verifyOtp(email: string, otp: string, session?: string) {
    //console.log('Verifying OTP for', email, 'with session', session);
    try {
      // Respond with the EMAIL_OTP code
      //console.log('Responding to EMAIL_OTP challenge', this.clientId, email, otp, session);
      const cmd = new RespondToAuthChallengeCommand({
        ClientId: this.clientId,
        ChallengeName: 'EMAIL_OTP',
        ChallengeResponses: {
          USERNAME: email,
          EMAIL_OTP_CODE: otp,
        },
        Session: session,
      });

      const response = await this.cognitoClient.send(cmd);
      //console.log('Cognito verifyOtp response:', response);
      if (response.AuthenticationResult?.IdToken) {
        return {
          sub: response.AuthenticationResult.IdToken?.split('.')[1] ?
            JSON.parse(Buffer.from(response.AuthenticationResult.IdToken.split('.')[1], 'base64').toString()).sub : null,
          email: email,
          accessToken: response.AuthenticationResult.AccessToken,
          idToken: response.AuthenticationResult.IdToken,
          refreshToken: response.AuthenticationResult.RefreshToken,
        };
      }

      return null;
    } catch (error) {
      console.error('Cognito verifyOtp error:', error);
      return null;
    }
  }

  async registerUser(email: string, password: string, firstName: string, lastName: string) {
    try {
      const command = new SignUpCommand({
        ClientId: this.clientId,
        Username: email,
        Password: password,
        UserAttributes: [
          {
            Name: 'email',
            Value: email,
          },
          {
            Name: 'given_name',
            Value: firstName,
          },
          {
            Name: 'family_name',
            Value: lastName,
          },
          {
            Name: 'name',
            Value: `${firstName} ${lastName}`,
          },
        ],
      });
      
      const response = await this.cognitoClient.send(command);
      
      return {
        sub: response.UserSub,
        email: email,
        firstName: firstName,
        lastName: lastName,
        confirmed: response.UserConfirmed,
      };
    } catch (error) {
      
      console.error('Cognito registration error:', error);
      throw error;
    }
  }

  async confirmUser(email: string, confirmationCode: string) {
    try {
      const command = new ConfirmSignUpCommand({
        ClientId: this.clientId,
        Username: email,
        ConfirmationCode: confirmationCode,
      });

      await this.cognitoClient.send(command);
      return true;
    } catch (error) {
      console.error('Cognito confirmation error:', error);
      return false;
    }
  }

  async createUser(email: string, firstName: string, lastName: string, temporaryPassword?: string) {
    try {
      const command = new AdminCreateUserCommand({
        UserPoolId: this.userPoolId,
        Username: email,
        UserAttributes: [
          {
            Name: 'email',
            Value: email,
          },
          {
            Name: 'given_name',
            Value: firstName,
          },
          {
            Name: 'family_name',
            Value: lastName,
          },
          {
            Name: 'email_verified',
            Value: 'true',
          },
        ],
        TemporaryPassword: temporaryPassword,
        MessageAction: 'SUPPRESS', // Don't send welcome email
      });

      const response = await this.cognitoClient.send(command);
      
      return {
        sub: response.User?.Username,
        email: email,
        firstName: firstName,
        lastName: lastName,
        temporaryPassword: temporaryPassword,
      };
    } catch (error) {
      console.error('Cognito user creation error:', error);
      throw error;
    }
  }

  async updateUserAttributes(username: string, attributes: { Name: string; Value: string }[]) {
    try {
      const cmd = new AdminUpdateUserAttributesCommand({
        UserPoolId: this.userPoolId,
        Username: username,
        UserAttributes: attributes,
      });

      await this.cognitoClient.send(cmd);
      return true;
    } catch (error) {
      console.error('Cognito update user attributes error:', error);
      throw error;
    }
  }

  async disableUser(username: string) {
    try {
      const cmd = new AdminDisableUserCommand({
        UserPoolId: this.userPoolId,
        Username: username,
      });
      await this.cognitoClient.send(cmd);
      return true;
    } catch (error) {
      console.error('Cognito disable user error:', error);
      throw error;
    }
  }

  async enableUser(username: string) {
    try {
      const cmd = new AdminEnableUserCommand({
        UserPoolId: this.userPoolId,
        Username: username,
      });
      await this.cognitoClient.send(cmd);
      return true;
    } catch (error) {
      console.error('Cognito enable user error:', error);
      throw error;
    }
  }
}
