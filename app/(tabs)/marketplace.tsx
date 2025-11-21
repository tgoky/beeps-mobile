import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';

type MarketplaceTab = 'beats' | 'studios' | 'equipment';

export default function MarketplaceScreen() {
  const [activeTab, setActiveTab] = useState<MarketplaceTab>('beats');

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Marketplace</Text>
      </View>

      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'beats' && styles.tabActive]}
          onPress={() => setActiveTab('beats')}
        >
          <Text style={[styles.tabText, activeTab === 'beats' && styles.tabTextActive]}>
            Beats
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'studios' && styles.tabActive]}
          onPress={() => setActiveTab('studios')}
        >
          <Text style={[styles.tabText, activeTab === 'studios' && styles.tabTextActive]}>
            Studios
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'equipment' && styles.tabActive]}
          onPress={() => setActiveTab('equipment')}
        >
          <Text style={[styles.tabText, activeTab === 'equipment' && styles.tabTextActive]}>
            Equipment
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {activeTab === 'beats' && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>Browse Beats</Text>
            <Text style={styles.emptyText}>
              Discover and purchase high-quality beats from talented producers
            </Text>
          </View>
        )}

        {activeTab === 'studios' && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>Find Studios</Text>
            <Text style={styles.emptyText}>
              Book recording studios in your area
            </Text>
          </View>
        )}

        {activeTab === 'equipment' && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>Equipment Market</Text>
            <Text style={styles.emptyText}>
              Buy or rent music production equipment
            </Text>
          </View>
        )}
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
    padding: 24,
    paddingTop: 60,
    paddingBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    gap: 8,
    marginBottom: 16,
  },
  tab: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
  },
  tabActive: {
    backgroundColor: '#007AFF',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  tabTextActive: {
    color: '#fff',
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
