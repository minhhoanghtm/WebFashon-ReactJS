import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import { GoogleOAuthProvider } from "@/components/GoogleOAuthProvider";
// Shim ReactDOM.findDOMNode for React 19 compatibility with react-quill
import ReactDOMLegacy from 'react-dom';
const findDOMNodeShim = (node) => {
  if (!node) return null;
  if (node instanceof HTMLElement) return node;
  return node;
};
if (!ReactDOMLegacy.findDOMNode) {
  ReactDOMLegacy.findDOMNode = findDOMNodeShim;
}



ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <GoogleOAuthProvider>
      <App />
    </GoogleOAuthProvider>
  </React.StrictMode>
);
