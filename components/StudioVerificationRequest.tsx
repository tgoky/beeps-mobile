import { useAuth } from "@/contexts/AuthContext";
import {
    useRequestVerification,
    useStudioVerification,
} from "@/hooks/useStudios";
import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
    ActivityIndicator,
    Alert,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

const COLORS = {
  background: "#000000",
  cardBlack: "#0A0A0A",
  cardDark: "#151515",
  pureWhite: "#FFFFFF",
  textGrey: "#888888",
  border: "#222222",
  accent: "#f59e0b",
  blue: "#3B82F6",
  red: "#EF4444",
  green: "#00C853",
};

interface Props {
  studioId: string;
  onStatusChange?: () => void;
}

export default function StudioVerificationRequest({
  studioId,
  onStatusChange,
}: Props) {
  const { user } = useAuth();
  const { data: verification, isLoading } = useStudioVerification(studioId);
  const requestVerification = useRequestVerification();

  const [documents, setDocuments] = useState<string[]>([]);
  const [docInput, setDocInput] = useState("");

  if (isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator color={COLORS.accent} />
      </View>
    );
  }

  const status = verification?.status || "UNVERIFIED";

  if (status === "VERIFIED") {
    return (
      <View style={[styles.container, styles.statusCard]}>
        <View
          style={[
            styles.statusBanner,
            { backgroundColor: "rgba(59, 130, 246, 0.1)" },
          ]}
        >
          <Ionicons name="shield-checkmark" size={24} color={COLORS.blue} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.statusTitle, { color: COLORS.blue }]}>
              Studio Verified
            </Text>
            <Text style={styles.statusDesc}>
              Your studio has been verified and will display a verification
              badge.
            </Text>
          </View>
        </View>
      </View>
    );
  }

  if (status === "PENDING") {
    return (
      <View style={[styles.container, styles.statusCard]}>
        <View
          style={[
            styles.statusBanner,
            { backgroundColor: "rgba(245, 158, 11, 0.1)" },
          ]}
        >
          <Ionicons name="time-outline" size={24} color={COLORS.accent} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.statusTitle, { color: COLORS.accent }]}>
              Verification Under Review
            </Text>
            <Text style={styles.statusDesc}>
              Your verification request is being reviewed. You will be notified
              once it is processed.
            </Text>
          </View>
        </View>
      </View>
    );
  }

  const addDocument = () => {
    const trimmed = docInput.trim();
    if (!trimmed) return;
    if (documents.includes(trimmed)) {
      Alert.alert("Duplicate", "This document URL has already been added.");
      return;
    }
    setDocuments((prev) => [...prev, trimmed]);
    setDocInput("");
  };

  const removeDocument = (index: number) => {
    setDocuments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!user) {
      Alert.alert("Error", "Please sign in");
      return;
    }
    if (documents.length === 0) {
      Alert.alert(
        "Documents Required",
        "Please add at least one document URL to verify your studio.",
      );
      return;
    }

    try {
      await requestVerification.mutateAsync({
        studioId,
        userId: user.id,
        documents,
      });
      Alert.alert("Success", "Verification request submitted!");
      onStatusChange?.();
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to submit verification");
    }
  };

  return (
    <View style={styles.container}>
      {status === "REJECTED" && verification?.notes && (
        <View
          style={[
            styles.statusBanner,
            { backgroundColor: "rgba(239, 68, 68, 0.1)", marginBottom: 16 },
          ]}
        >
          <Ionicons name="alert-circle" size={20} color={COLORS.red} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.statusTitle, { color: COLORS.red }]}>
              Previous Request Rejected
            </Text>
            <Text style={[styles.statusDesc, { color: COLORS.red }]}>
              {verification.notes}
            </Text>
          </View>
        </View>
      )}

      <Text style={styles.sectionTitle}>REQUEST VERIFICATION</Text>
      <Text style={styles.helpText}>
        Submit documentation to verify your studio ownership. This can include
        business registration, lease agreements, or utility bills.
      </Text>

      {/* Document input */}
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={docInput}
          onChangeText={setDocInput}
          placeholder="Document URL (e.g., link to image or PDF)"
          placeholderTextColor={COLORS.textGrey}
          onSubmitEditing={addDocument}
          returnKeyType="done"
        />
        <TouchableOpacity style={styles.addBtn} onPress={addDocument}>
          <Ionicons name="add" size={20} color={COLORS.background} />
        </TouchableOpacity>
      </View>

      {/* Document list */}
      {documents.map((doc, index) => (
        <View key={index} style={styles.docItem}>
          <Ionicons name="document-outline" size={16} color={COLORS.accent} />
          <Text style={styles.docUrl} numberOfLines={1}>
            {doc}
          </Text>
          <TouchableOpacity onPress={() => removeDocument(index)}>
            <Ionicons name="close-circle" size={18} color={COLORS.red} />
          </TouchableOpacity>
        </View>
      ))}

      {/* Submit button */}
      <TouchableOpacity
        style={[styles.submitBtn, documents.length === 0 && { opacity: 0.5 }]}
        onPress={handleSubmit}
        disabled={requestVerification.isPending || documents.length === 0}
      >
        {requestVerification.isPending ? (
          <ActivityIndicator color={COLORS.background} size="small" />
        ) : (
          <>
            <Ionicons
              name="shield-checkmark-outline"
              size={18}
              color={COLORS.background}
            />
            <Text style={styles.submitText}>SUBMIT FOR VERIFICATION</Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  statusCard: {
    paddingVertical: 8,
  },
  statusBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 16,
    borderRadius: 16,
  },
  statusTitle: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 4,
  },
  statusDesc: {
    fontSize: 12,
    color: COLORS.textGrey,
    lineHeight: 18,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: COLORS.pureWhite,
    letterSpacing: 1,
    marginBottom: 8,
  },
  helpText: {
    fontSize: 13,
    color: COLORS.textGrey,
    lineHeight: 20,
    marginBottom: 16,
  },
  inputRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
  },
  input: {
    flex: 1,
    backgroundColor: COLORS.cardDark,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: COLORS.pureWhite,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  addBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: COLORS.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  docItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: COLORS.cardDark,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 8,
  },
  docUrl: {
    flex: 1,
    fontSize: 12,
    color: COLORS.pureWhite,
  },
  submitBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: COLORS.pureWhite,
    marginTop: 8,
  },
  submitText: {
    fontSize: 14,
    fontWeight: "800",
    color: COLORS.background,
    letterSpacing: 0.5,
  },
});
