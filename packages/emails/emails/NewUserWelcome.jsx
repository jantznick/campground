import React from 'react';
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Text,
} from '@react-email/components';

const main = {
  backgroundColor: '#ffffff',
  fontFamily: 'HelveticaNeue,Helvetica,Arial,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  border: '1px solid #eee',
  borderRadius: '5px',
  boxShadow: '0 5px 10px rgba(20,50,70,.2)',
  marginTop: '20px',
  maxWidth: '360px',
  margin: '0 auto',
  padding: '20px 0 48px',
};

const heading = {
  color: '#003049', // prussian-blue
  fontSize: '24px',
  fontWeight: 'bold',
  textAlign: 'center',
  marginBottom: '30px',
};

const text = {
  color: '#003049',
  fontSize: '14px',
  lineHeight: '24px',
};

const btn = {
  backgroundColor: '#f77f00', // orange-wheel
  borderRadius: '5px',
  color: '#fff',
  fontSize: '12px',
  fontWeight: 500,
  lineHeight: '50px',
  textDecoration: 'none',
  textAlign: 'center',
  display: 'block',
  width: '200px',
  margin: '0 auto',
};

const codeContainer = {
  background: 'rgba(0,0,0,.05)',
  borderRadius: '4px',
  margin: '16px auto 14px',
  verticalAlign: 'middle',
  width: '280px',
};

const codeText = {
  color: '#000',
  fontSize: '36px',
  fontWeight: 'bold',
  textAlign: 'center',
  letterSpacing: '10px'
};

export function NewUserWelcome({
  firstName = 'User',
  loginUrl = 'http://localhost:3000/login',
  verificationCode = '123456',
}) {
  return (
  <Html>
    <Head />
    <Preview>Welcome to Campground</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={heading}>Welcome to Campground!</Heading>
        <Text style={{ ...text, textAlign: 'center' }}>
          Hi {firstName},
        </Text>
        <Text
          style={{
            ...text,
            padding: '0 20px',
            textAlign: 'center',
          }}
        >
          {verificationCode
            ? "Thanks for signing up! Please use the code below to verify your email address and finish setting up your account."
            : "We're excited to have you on board. To get started, please log in to your new account."}
        </Text>
        
        {verificationCode && (
          <>
            <div style={codeContainer}>
              <Text style={codeText}>{verificationCode}</Text>
            </div>
            <Text
              style={{
                ...text,
                padding: '0 20px',
                textAlign: 'center',
              }}
            >
              (This code is valid for 15 minutes)
            </Text>
          </>
        )}

        <Button style={btn} href={loginUrl}>
          {verificationCode ? 'Go to Verification' : 'Login to Your Account'}
        </Button>
      </Container>
    </Body>
  </Html>
  );
}

export default NewUserWelcome; 