import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components';
import * as React from 'react';

export const MagicLinkLogin = ({ magicLink }) => (
  <Html>
    <Head />
    <Preview>Your Magic Login Link for Campground</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Log in to Campground</Heading>
        <Section>
          <Text style={text}>
            Welcome! Click the button below to securely log in to your Campground account. This link will expire in 15 minutes and can only be used once.
          </Text>
          <Button style={button} href={magicLink}>
            Log In
          </Button>
          <Text style={text}>
            If you did not request this email, you can safely ignore it.
          </Text>
           <Text style={text}>
            If the button above does not work, you can also copy and paste the following link into your browser:
          </Text>
          <Text style={link}>{magicLink}</Text>
        </Section>
      </Container>
    </Body>
  </Html>
);

export default MagicLinkLogin;

const main = {
  backgroundColor: '#f6f9fc',
  padding: '20px',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
  border: '1px solid #f0f0f0',
  borderRadius: '4px',
};

const h1 = {
  color: '#333',
  fontSize: '24px',
  fontWeight: 'bold',
  textAlign: 'center',
  margin: '30px 0',
};

const text = {
  color: '#555',
  fontSize: '16px',
  lineHeight: '26px',
  margin: '16px 30px',
};

const button = {
  backgroundColor: '#007bff',
  borderRadius: '3px',
  color: '#fff',
  fontSize: '16px',
  textDecoration: 'none',
  textAlign: 'center',
  display: 'block',
  padding: '12px',
  margin: '20px auto',
  width: '200px',
};

const link = {
  color: '#007bff',
  fontSize: '14px',
  wordBreak: 'break-all',
  margin: '0 30px',
} 