import { VerificationStatus } from "@/types/database";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

interface Props {
  status: VerificationStatus;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
}

const STATUS_CONFIG: Record<
  VerificationStatus,
  {
    icon: keyof typeof Ionicons.glyphMap;
    color: string;
    bg: string;
    label: string;
  }
> = {
  VERIFIED: {
    icon: "shield-checkmark",
    color: "#3B82F6",
    bg: "rgba(59, 130, 246, 0.1)",
    label: "Verified",
  },
  PENDING: {
    icon: "time-outline",
    color: "#F59E0B",
    bg: "rgba(245, 158, 11, 0.1)",
    label: "Pending",
  },
  REJECTED: {
    icon: "close-circle-outline",
    color: "#EF4444",
    bg: "rgba(239, 68, 68, 0.1)",
    label: "Rejected",
  },
  UNVERIFIED: {
    icon: "shield-outline",
    color: "#6B7280",
    bg: "rgba(107, 114, 128, 0.1)",
    label: "Unverified",
  },
};

const ICON_SIZES = {
  sm: 14,
  md: 18,
  lg: 22,
};

export default function StudioVerificationBadge({
  status,
  size = "md",
  showLabel = false,
}: Props) {
  const config = STATUS_CONFIG[status];
  const iconSize = ICON_SIZES[size];

  // Don't render anything for unverified unless labels are shown
  if (status === "UNVERIFIED" && !showLabel) return null;

  if (!showLabel) {
    return <Ionicons name={config.icon} size={iconSize} color={config.color} />;
  }

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: config.bg,
          borderColor: config.color,
        },
      ]}
    >
      <Ionicons name={config.icon} size={12} color={config.color} />
      <Text style={[styles.label, { color: config.color }]}>
        {config.label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  label: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
});
