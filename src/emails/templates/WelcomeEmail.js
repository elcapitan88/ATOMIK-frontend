import {
    Body,
    Button,
    Container,
    Head,
    Heading,
    Hr,
    Html,
    Link,
    Preview,
    Section,
    Text,
  } from '@react-email/components';
  import * as React from 'react';
  
  const WelcomeEmail = ({ email }) => (
    <Html>
      <Head />
      <Preview>Welcome to Atomik Trading</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Welcome to Atomik Trading</Heading>
          <Text style={text}>
            Thank you for subscribing to our newsletter! We're excited to keep you updated on the latest
            features, trading insights, and platform updates.
          </Text>
          <Section style={buttonContainer}>
            <Button
              href="https://atomiktrading.io/dashboard"
              style={button}
            >
              Get Started
            </Button>
          </Section>
          <Text style={text}>
            If you have any questions, feel free to{' '}
            <Link href="mailto:support@atomiktrading.io" style={link}>
              contact our support team
            </Link>
            .
          </Text>
          <Hr style={hr} />
          <Text style={footer}>
            Atomik Trading, Inc.<br />
            Your trusted automated trading platform
          </Text>
        </Container>
      </Body>
    </Html>
  );
  
  const main = {
    backgroundColor: '#ffffff',
    fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
  };
  
  const container = {
    margin: '0 auto',
    padding: '20px 0 48px',
    maxWidth: '580px',
  };
  
  const h1 = {
    color: '#1a1a1a',
    fontSize: '24px',
    fontWeight: 'normal',
    textAlign: 'center',
    margin: '30px 0',
  };
  
  const text = {
    color: '#444',
    fontSize: '16px',
    lineHeight: '24px',
    textAlign: 'left',
  };
  
  const buttonContainer = {
    textAlign: 'center',
    margin: '30px 0',
  };
  
  const button = {
    backgroundColor: '#00C6E0',
    borderRadius: '3px',
    color: '#fff',
    fontSize: '16px',
    textDecoration: 'none',
    textAlign: 'center',
    display: 'inline-block',
    padding: '12px 24px',
  };
  
  const link = {
    color: '#00C6E0',
    textDecoration: 'underline',
  };
  
  const hr = {
    borderColor: '#cccccc',
    margin: '20px 0',
  };
  
  const footer = {
    color: '#8898aa',
    fontSize: '12px',
    lineHeight: '16px',
    textAlign: 'center',
  };
  
  export default WelcomeEmail;