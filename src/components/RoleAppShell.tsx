import React, {
  type ComponentProps,
  type ReactNode,
  useState,
} from 'react';

import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';

import { SafeAreaView } from 'react-native-safe-area-context';

import { COLORS } from '../constants/colors';

import PlaceholderScreen from './PlaceholderScreen';

type IconName = ComponentProps<
  typeof Ionicons
>['name'];

type TabKey =
  | 'home'
  | 'activity'
  | 'services'
  | 'profile'
  | 'reports';

interface PlaceholderConfig {
  title: string;
  description: string;
}

interface Props {
  home: ReactNode;
request-verification-and-donor-matching-
  activityContent?: ReactNode;
  servicesContent?: ReactNode; 
        dev
  activity: PlaceholderConfig;

  activityContent?: ReactNode;


  services: PlaceholderConfig;

  profile: PlaceholderConfig;

  profileContent?: ReactNode;


  activityContent?: ReactNode;

  servicesContent?: ReactNode;

  reportsContent?: ReactNode;

  reports?: PlaceholderConfig;


  tabLabels?: Partial<Record<TabKey, string>>;

  tabIcons?: Partial<
    Record<
      TabKey,
      {
        icon: IconName;
        activeIcon: IconName;
      }
    >
  >;
request-verification-and-donor-matching-
  activeTabColor?: string;
  bottomBorderColor?: string;
  initialTab?: TabKey;
  tabPressHandlers?: Partial<Record<TabKey, () => void>>;

  showReports?: boolean;
 dev
}

const defaultTabs = [
  {
    key: 'home' as TabKey,
    label: 'Home',
    icon: 'home-outline' as IconName,
    activeIcon: 'home' as IconName,
  },

  {
    key: 'activity' as TabKey,
    label: 'Activity',
    icon: 'list-outline' as IconName,
    activeIcon: 'list' as IconName,
  },

  {
    key: 'services' as TabKey,
    label: 'Services',
    icon: 'apps-outline' as IconName,
    activeIcon: 'apps' as IconName,
  },

  {
    key: 'profile' as TabKey,
    label: 'Profile',
    icon: 'person-outline' as IconName,
    activeIcon: 'person' as IconName,
  },

  {
    key: 'reports' as TabKey,
    label: 'Reports',
    icon: 'bar-chart-outline' as IconName,
    activeIcon: 'bar-chart' as IconName,
  },
];

export default function RoleAppShell({
  home,
  activityContent,
  servicesContent,
  activity,
  activityContent,
  services,
  profile,

  profileContent,


  activityContent,
  servicesContent,

  reports,
  reportsContent,


  tabLabels,
  tabIcons,
  request-verification-and-donor-matching-
  activeTabColor = COLORS.primary,
  bottomBorderColor = COLORS.border,
  initialTab = 'home',
  tabPressHandlers,

  showReports = false,
  dev
}: Props) {
  const [activeTab, setActiveTab] = useState<TabKey>(initialTab);

  const tabs = defaultTabs
    .filter(tab => {
      // Show Reports only when enabled
      if (tab.key === 'reports') {
        return showReports;
      }

      // When Reports is enabled,
      // hide Profile.
      if (
        tab.key === 'profile' &&
        showReports
      ) {
        return false;
      }

      return true;
    })
    .map(tab => ({
      ...tab,

      label:
        tabLabels?.[tab.key] ??
        tab.label,

      icon:
        tabIcons?.[tab.key]?.icon ??
        tab.icon,

      activeIcon:
        tabIcons?.[tab.key]?.activeIcon ??
        tab.activeIcon,
    }));

  let content: ReactNode = home;

  // INVENTORY
  if (activeTab === 'activity') {

    content = activityContent ?? (
      <PlaceholderScreen
        title={activity.title}
        description={activity.description}
      />

 request-verification-and-donor-matching-
    content = activityContent ?? (
      <PlaceholderScreen title={activity.title} description={activity.description} />

    );

    content =
      activityContent ?? (
        <PlaceholderScreen
          title={activity.title}
          description={activity.description}
        />
      ); 
    dev
  }

  // REQUESTS
  if (activeTab === 'services') {
request-verification-and-donor-matching-
    content = servicesContent ?? (
      <PlaceholderScreen
        title={services.title}
        description={services.description}
      />
    );

    content =
      servicesContent ?? (
        <PlaceholderScreen
          title={services.title}
          description={services.description}
        />
      );
dev
  }

  // PROFILE
  if (activeTab === 'profile') {
    content = profileContent ?? (
      <PlaceholderScreen
        title={profile.title}
        description={profile.description}
      />
    );
  }

  // REPORTS
  if (activeTab === 'reports') {
    content =
      reportsContent ?? (
        <PlaceholderScreen
          title={
            reports?.title ??
            'Inventory Reports'
          }
          description={
            reports?.description ??
            'View blood inventory reports.'
          }
        />
      );
  }

  return (
    <SafeAreaView
      style={styles.container}
      edges={['bottom']}
    >
      <View style={styles.content}>
        {content}
      </View>

      <View
        style={[
          styles.bottomBar,
          { borderTopColor: bottomBorderColor },
        ]}
      >
        {tabs.map(tab => {
          const isActive =
            activeTab === tab.key;

          return (
            <Pressable
              key={tab.key}
              style={styles.tabButton}
              onPress={() => {
                const handler = tabPressHandlers?.[tab.key];
                if (handler) {
                  handler();
                  return;
                }
                setActiveTab(tab.key);
              }}
            >
request-verification-and-donor-matching-
              <Ionicons
                name={
                  isActive
                    ? tab.activeIcon
                    : tab.icon
                }
                size={21}
                color={
                  isActive
                    ? activeTabColor
                    : '#8A8A8A'
                }
              />
              <View
                style={[
                  styles.iconContainer,
                  isActive &&
                    styles.activeIconContainer,
                ]}
              >
                <Ionicons
                  name={
                    isActive
                      ? tab.activeIcon
                      : tab.icon
                  }
                  size={21}
                  color={
                    isActive
                      ? COLORS.primary
                      : '#8A8A8A'
                  }
                />
              </View> 
              dev

              <Text
                style={[
                  styles.tabLabel,
                isActive && [
                  styles.activeTabLabel,
                  { color: activeTabColor },
                ],
                ]}
                numberOfLines={1}
              >
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },

  content: {
    flex: 1,
  },

  bottomBar: {
    minHeight: 66,
    paddingTop: 7,
    paddingBottom: 7,
    paddingHorizontal: 8,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    flexDirection: 'row',
    alignItems: 'center',
  },

  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },

  iconContainer: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 15,
  },

  activeIconContainer: {
    backgroundColor: '#FDE7EA',
  },

  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#8A8A8A',
  },

  activeTabLabel: {
    color: COLORS.primary,
  },
});
