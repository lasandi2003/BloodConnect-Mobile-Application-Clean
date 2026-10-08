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

import {
  Ionicons,
} from '@expo/vector-icons';

import {
  SafeAreaView,
} from 'react-native-safe-area-context';

import {
  COLORS,
} from '../constants/colors';

import PlaceholderScreen from './PlaceholderScreen';

type IconName = ComponentProps<
  typeof Ionicons
>['name'];

type TabKey =
  | 'home'
  | 'activity'
  | 'services'
  | 'profile';

interface TabItem {
  key: TabKey;
  label: string;
  icon: IconName;
  activeIcon: IconName;
}

interface PlaceholderConfig {
  title: string;
  description: string;
}

interface Props {
  home: ReactNode;

  activity: PlaceholderConfig;

  services: PlaceholderConfig;

  profile: PlaceholderConfig;

  /*
   * Optional real screens.
   *
   * If these are provided, they will be shown
   * instead of PlaceholderScreen.
   */
  activityContent?: ReactNode;

  servicesContent?: ReactNode;

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
}

const defaultTabs: TabItem[] = [
  {
    key: 'home',
    label: 'Home',
    icon: 'home-outline',
    activeIcon: 'home',
  },

  {
    key: 'activity',
    label: 'Activity',
    icon: 'list-outline',
    activeIcon: 'list',
  },

  {
    key: 'services',
    label: 'Services',
    icon: 'apps-outline',
    activeIcon: 'apps',
  },

  {
    key: 'profile',
    label: 'Profile',
    icon: 'person-outline',
    activeIcon: 'person',
  },
];

export default function RoleAppShell({
  home,
  activity,
  services,
  profile,

  activityContent,
  servicesContent,

  tabLabels,
  tabIcons,
}: Props) {
  const [activeTab, setActiveTab] =
    useState<TabKey>('home');

  const tabs = defaultTabs.map(tab => ({
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

  // ========================================
  // INVENTORY / ACTIVITY TAB
  // ========================================

  if (activeTab === 'activity') {
    content =
      activityContent ?? (
        <PlaceholderScreen
          title={activity.title}
          description={activity.description}
        />
      );
  }

  // ========================================
  // REQUESTS / SERVICES TAB
  // ========================================

  if (activeTab === 'services') {
    content =
      servicesContent ?? (
        <PlaceholderScreen
          title={services.title}
          description={services.description}
        />
      );
  }

  // ========================================
  // PROFILE TAB
  // ========================================

  if (activeTab === 'profile') {
    content = (
      <PlaceholderScreen
        title={profile.title}
        description={profile.description}
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

      <View style={styles.bottomBar}>
        {tabs.map(tab => {
          const isActive =
            activeTab === tab.key;

          return (
            <Pressable
              key={tab.key}
              style={styles.tabButton}
              onPress={() =>
                setActiveTab(tab.key)
              }
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

              <Text
                style={[
                  styles.tabLabel,
                  isActive &&
                    styles.activeTabLabel,
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

  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#8A8A8A',
  },

  activeTabLabel: {
    color: COLORS.primary,
  },
});