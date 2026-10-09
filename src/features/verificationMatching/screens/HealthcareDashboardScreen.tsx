import React from 'react';

import RoleDashboard from '../../../components/RoleDashboard';

export default function HealthcareDashboardScreen() {
  return (
    <RoleDashboard
      title="Healthcare Dashboard"
      subtitle="Verify emergency requests and coordinate donor matching."
      items={[
        {
          title:
            'Pending Requests',
          description:
            'Review emergency blood requests awaiting verification.',
          icon:
            'hourglass-outline',
        },

        {
          title:
            'Verify Request',
          description:
            'Review patient and blood requirement information.',
          icon:
            'shield-checkmark-outline',
        },

        {
          title:
            'Donor Matching',
          description:
            'Find suitable donors according to blood requirements.',
          icon:
            'people-circle-outline',
        },

        {
          title:
            'Verified Requests',
          description:
            'View previously verified emergency requests.',
          icon:
            'checkmark-done-outline',
        },
      ]}
    />
  );
}