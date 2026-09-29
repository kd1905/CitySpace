import React from 'react';
import { Redirect } from 'expo-router';

export default function RootIndex() {
  // Directly open the public Cityspace marketplace without requiring login
  return <Redirect href="/(tabs)" />;
}
