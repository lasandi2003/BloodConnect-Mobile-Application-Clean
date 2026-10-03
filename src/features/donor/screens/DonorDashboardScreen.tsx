import React from 'react';

import RoleDashboard from '../../../components/RoleDashboard';

export default function DonorDashboardScreen() {
  return (
    <RoleDashboard
      title="Donor Dashboard"
      subtitle="Manage your donor profile and respond to emergency blood requests."
      items={[
        {
          title:
            'Emergency Requests',
          description:
            'View compatible emergency blood requests.',
          icon:
            'alert-circle-outline',
        },

        {
          title:
            'Availability',
          description:
            'Update whether you are currently available to donate.',
          icon:
            'checkmark-circle-outline',
        },

        {
          title:
            'Donation History',
          description:
            'View previous donation responses and completed donations.',
          icon:
            'time-outline',
        },

        {
          title:
            'My Profile',
          description:
            'Manage blood group and personal donor information.',
          icon:
            'person-outline',
        },
      ]}
    />
  );
}