import React, {
  type ComponentProps,
} from 'react';

import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  type TextInputProps,
  View,
} from 'react-native';

import {
  Ionicons,
} from '@expo/vector-icons';

import {
  COLORS,
} from '../../../constants/colors';

type IconName =
  ComponentProps<
    typeof Ionicons
  >['name'];

interface AuthInputProps
  extends TextInputProps {
  label: string;

  icon:
    IconName;

  rightIcon?:
    IconName;

  onRightPress?:
    () => void;
}

export default function AuthInput({
  label,
  icon,
  rightIcon,
  onRightPress,
  ...props
}: AuthInputProps) {
  return (
    <View
      style={
        styles.container
      }
    >
      <Text
        style={
          styles.label
        }
      >
        {label}
      </Text>

      <View
        style={
          styles.inputContainer
        }
      >
        <Ionicons
          name={icon}
          size={18}
          color={
            COLORS.textSecondary
          }
        />

        <TextInput
          {...props}
          style={
            styles.input
          }
          placeholderTextColor="#A0A0A0"
        />

        {rightIcon ? (
          <Pressable
            onPress={
              onRightPress
            }
          >
            <Ionicons
              name={
                rightIcon
              }
              size={19}
              color={
                COLORS.textSecondary
              }
            />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles =
  StyleSheet.create({
    container: {
      marginBottom: 16,
    },

    label: {
      marginBottom: 7,
      color:
        COLORS.textSecondary,
      fontSize: 13,
      fontWeight: '500',
    },

    inputContainer: {
      minHeight: 52,
      borderRadius: 10,
      backgroundColor:
        COLORS.inputBackground,
      paddingHorizontal: 14,
      flexDirection: 'row',
      alignItems: 'center',
    },

    input: {
      flex: 1,
      marginLeft: 10,
      fontSize: 15,
      color:
        COLORS.text,
    },
  });