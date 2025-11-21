import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';

export default function CommunityScreen() {
  const { user } = useAuth();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Community</Text>
        <TouchableOpacity style={styles.createButton}>
          <Text style={styles.createButtonText}>+ Post</Text>
        </TouchableOpacity>
      </View>

      {user && (
        <View style={styles.roleIndicator}>
          <Text style={styles.roleText}>
            Viewing as: <Text style={styles.roleBold}>{user.primaryRole}</Text>
          </Text>
        </View>
      )}

      <ScrollView style={styles.content}>
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>Community Feed</Text>
          <Text style={styles.emptyText}>
            Connect with other creators, share your work, and collaborate
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    paddingTop: 60,
    paddingBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  createButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  createButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  roleIndicator: {
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  roleText: {
    color: '#666',
  },
  roleBold: {
    fontWeight: '600',
    color: '#000',
    textTransform: 'capitalize',
  },
  content: {
    flex: 1,
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  emptyText: {
    color: '#666',
    fontSize: 16,
    textAlign: 'center',
  },
});
