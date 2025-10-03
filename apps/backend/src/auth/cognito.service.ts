import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CognitoIdentityProviderClient, InitiateAuthCommand, SignUpCommand, ConfirmSignUpCommand, AdminCreateUserCommand } from '@aws-sdk/client-cognito-identity-provider';

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
}
