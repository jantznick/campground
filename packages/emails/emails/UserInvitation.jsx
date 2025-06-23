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

export const UserInvitation = ({
  inviterName = 'Someone',
  organizationName = 'an organization',
  inviteLink = 'http://localhost:3000/register?invite_token=test-token',
}) => (
  <Html>
    <Head />
    <Preview>You've been invited to Campground</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={heading}>You're Invited!</Heading>
        <Text
          style={{
            ...text,
            padding: '0 20px',
            textAlign: 'center',
          }}
        >
          {inviterName} has invited you to join {organizationName} on Campground.
        </Text>
        <Text
          style={{
            ...text,
            padding: '0 20px',
            textAlign: 'center',
          }}
        >
          Click the button below to set up your account and get started.
        </Text>
        <Button style={btn} href={inviteLink}>
          Accept Invitation
        </Button>
      </Container>
    </Body>
  </Html>
);

export default UserInvitation; 