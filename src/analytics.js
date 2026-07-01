// src/analytics.js
import ReactGA from "react-ga4";

export const initGA = () => {
  // PASTE YOUR MEASUREMENT ID HERE
  ReactGA.initialize("G-R7HK71S74X"); 
};

export const logPageView = () => {
  ReactGA.send({ hitType: "pageview", page: window.location.pathname });
};

export const logEvent = (category, action) => {
  ReactGA.event({
    category: category,
    action: action,
  });
};