// app/tabs/_layout.tsx (modified)
import React from 'react';
import SharedTabLayout from '../../components/SharedTabLayout'; // Ajustez le chemin si nécessaire

export const unstable_settings = {
  headerShown: false,
};
export default function Layout() {
  return <SharedTabLayout role="CLIENT" />;
}