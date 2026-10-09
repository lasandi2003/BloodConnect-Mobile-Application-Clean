import React from 'react';

import RoleDashboard from '../../../components/RoleDashboard';

export default function BloodBankDashboardScreen() {
  return (
    <RoleDashboard
      title="Blood Bank Dashboard"
      subtitle="Manage blood inventory and emergency request information."
      items={[
        {
          title:
            'Blood Inventory',
          description:
            'View current blood group availability.',
          icon:
            'water-outline',
        },

        {
          title:
            'Update Stock',
          description:
            'Add or update blood stock quantities.',
          icon:
            'create-outline',
        },

        {
          title:
            'Emergency Requests',
          description:
            'Review emergency blood requests.',
          icon:
            'alert-outline',
        },

        {
          title:
            'Inventory Reports',
          description:
            'View blood availability and inventory reports.',
          icon:
            'bar-chart-outline',
        },
      ]}
    />
  );
}