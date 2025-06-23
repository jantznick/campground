import React from 'react';
import {
  Body,
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
  maxWidth: '480px',
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
  padding: '0 40px',
};

export function AdminAutoJoinNotification({
  adminName = 'Admin',
  newUserName = 'New User',
  newUserEmail = 'user@example.com',
  itemName = 'your organization',
}) {
  return (
  <Html>
    <Head />
    <Preview>New User Joined via Auto-Join</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={heading}>New User Notification</Heading>
        <Text style={text}>
          Hi {adminName},
        </Text>
        <Text style={text}>
          This is an automated notification to let you know that a new user has
          joined {itemName} through the auto-join domain feature.
        </Text>
        <Text style={{...text, fontWeight: 'bold'}}>
          User Details:
        </Text>
        <Text style={text}>
          - Name: {newUserName}
          <br />
          - Email: {newUserEmail}
        </Text>
        <Text style={text}>
          No action is required on your part. This is just for your information.
        </Text>
      </Container>
    </Body>
  </Html>
  );
}

export default AdminAutoJoinNotification;