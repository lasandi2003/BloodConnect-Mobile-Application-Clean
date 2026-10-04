import React from 'react';

import RoleDashboard from '../../../components/RoleDashboard';

export default function RequesterDashboardScreen() {
  return (
    <RoleDashboard
      title="Emergency Request Dashboard"
      subtitle="Create and monitor emergency blood requests."
      items={[
        {
          title:
            'Create Emergency Request',
          description:
            'Submit a new emergency blood request.',
          icon:
            'add-circle-outline',
        },

        {
          title:
            'My Requests',
          description:
            'View your active and previous blood requests.',
          icon:
            'document-text-outline',
        },

        {
          title:
            'Request Status',
          description:
            'Monitor verification and donor matching progress.',
          icon:
            'pulse-outline',
        },

        {
          title:
            'Matched Donors',
          description:
            'View matching donors for verified requests.',
          icon:
            'people-outline',
        },
      ]}
    />
  );
}