// src/emails/components/Layout.js
import {
    Body,
    Container,
    Head,
    Html,
    Preview,
  } from '@react-email/components';
  import * as React from 'react';
  
  export const Layout = ({
    preview,
    children,
  }) => (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Body style={main}>
        <Container style={container}>
          {children}
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
  
  export default Layout;