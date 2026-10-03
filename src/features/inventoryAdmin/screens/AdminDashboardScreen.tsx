import React from 'react';

import RoleDashboard from '../../../components/RoleDashboard';

export default function AdminDashboardScreen() {
  return (
    <RoleDashboard
      title="Admin Dashboard"
      subtitle="Monitor users, emergency requests, and BloodConnect operations."
      items={[
        {
          title:
            'User Management',
          description:
            'Review registered users and account status.',
          icon:
            'people-outline',
        },

        {
          title:
            'Blood Inventory',
          description:
            'Monitor blood bank availability.',
          icon:
            'water-outline',
        },

        {
          title:
            'Emergency Requests',
          description:
            'Review and monitor emergency requests.',
          icon:
            'alert-circle-outline',
        },

        {
          title:
            'System Overview',
          description:
            'View BloodConnect operational information.',
          icon:
            'analytics-outline',
        },
      ]}
    />
  );
}