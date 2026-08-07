import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import {
  X,
  Zap,
  Droplet,
  Hammer,
  Sparkles,
  PaintBucket,
  Wind,
  Bug,
  Wrench,
  ShieldCheck,
  Tv,
  Cpu,
  Thermometer,
  Shield,
  Wifi,
  Sun,
  Camera,
  Home,
  Truck,
  Lock,
  Flame,
  Maximize,
  CheckCircle2,
  Clock,
  Info,
  AlertCircle,
  Calendar,
  Layers,
  RotateCcw,
  RefreshCw,
  Droplets,
  Utensils,
  Grid,
  Package,
  Layers3,
  HardHat,
  BatteryCharging,
} from 'lucide-react-native';
import { Colors } from '../../constants/colors';
import { ServiceCategory } from '../../constants/services';
import { BookServiceModal } from '../booking/BookServiceModal';

interface ServiceDetailModalProps {
  service: ServiceCategory | null;
  visible: boolean;
  onClose: () => void;
}

// Icon mapper for dynamic string icon name matching
const getServiceIconComponent = (iconName: string) => {
  switch (iconName) {
    case 'Zap': return Zap;
    case 'Droplet': return Droplet;
    case 'Hammer': return Hammer;
    case 'Sparkles': return Sparkles;
    case 'PaintBucket': return PaintBucket;
    case 'Wind': return Wind;
    case 'Bug': return Bug;
    case 'Wrench': return Wrench;
    case 'ShieldCheck': return ShieldCheck;
    case 'Tv': return Tv;
    case 'Cpu': return Cpu;
    case 'Thermometer': return Thermometer;
    case 'Shield': return Shield;
    case 'Wifi': return Wifi;
    case 'Sun': return Sun;
    case 'Camera': return Camera;
    case 'Home': return Home;
    case 'Truck': return Truck;
    case 'Lock': return Lock;
    case 'Flame': return Flame;
    case 'Maximize': return Maximize;
    case 'Layers': return Layers;
    case 'RotateCcw': return RotateCcw;
    case 'RefreshCw': return RefreshCw;
    case 'Droplets': return Droplets;
    case 'Utensils': return Utensils;
    case 'Grid': return Grid;
    case 'Package': return Package;
    case 'Layers3': return Layers3;
    case 'HardHat': return HardHat;
    case 'BatteryCharging': return BatteryCharging;
    default: return Wrench;
  }
};

export const ServiceDetailModal: React.FC<ServiceDetailModalProps> = ({
  service,
  visible,
  onClose,
}) => {
  const [bookModalVisible, setBookModalVisible] = useState(false);

  if (!service) return null;

  const IconComponent = getServiceIconComponent(service.iconName);

  return (
    <>
      <Modal
        visible={visible}
        animationType="slide"
        transparent={false}
        onRequestClose={onClose}
      >
        <SafeAreaView style={styles.container}>
          {/* Header Bar */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.backBtn}>
              <X size={24} color={Colors.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.headerCategoryGroup}>{service.categoryGroup}</Text>
            <View style={{ width: 40 }} />
          </View>

          <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {/* Service Hero Card */}
            <View style={styles.heroCard}>
              <View style={styles.iconCircle}>
                <IconComponent size={32} color={Colors.primary} />
              </View>

              <View style={styles.heroTextContent}>
                <View style={styles.titleBadgeRow}>
                  <Text style={styles.serviceTitle}>{service.title}</Text>
                  {service.badge && (
                    <View style={styles.badgeTag}>
                      <Text style={styles.badgeTagText}>{service.badge}</Text>
                    </View>
                  )}
                </View>

                <Text style={styles.serviceDescription}>{service.description}</Text>
              </View>
            </View>

            {/* Quick Metrics Bar: Price & Duration */}
            <View style={styles.metricsRow}>
              <View style={styles.metricCard}>
                <Clock size={20} color={Colors.primary} />
                <View style={styles.metricTextWrapper}>
                  <Text style={styles.metricLabel}>Average Duration</Text>
                  <Text style={styles.metricValue}>{service.estimatedDuration}</Text>
                </View>
              </View>

              <View style={styles.metricCard}>
                <Text style={styles.currencySymbol}>₹</Text>
                <View style={styles.metricTextWrapper}>
                  <Text style={styles.metricLabel}>Est. Price Range</Text>
                  <Text style={styles.metricValue}>{service.priceRange}</Text>
                </View>
              </View>
            </View>

            {/* Location Price Disclaimer */}
            <View style={styles.disclaimerBox}>
              <Info size={16} color={Colors.textMuted} style={{ marginTop: 2 }} />
              <Text style={styles.disclaimerText}>
                <Text style={{ fontWeight: '700', color: Colors.textSecondary }}>Location Pricing Note: </Text>
                Final pricing varies by city, provider rates, required materials, and exact work scope.
              </Text>
            </View>

            {/* Section 1: Common Problems Solved */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeaderRow}>
                <AlertCircle size={18} color={Colors.primary} />
                <Text style={styles.sectionTitle}>Common Problems Solved</Text>
              </View>

              <View style={styles.problemsList}>
                {service.commonProblems.map((prob, idx) => (
                  <View key={idx} style={styles.problemItem}>
                    <View style={styles.problemDot} />
                    <Text style={styles.problemText}>{prob}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Section 2: What's Included */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeaderRow}>
                <CheckCircle2 size={18} color={Colors.success} />
                <Text style={styles.sectionTitle}>What's Included</Text>
              </View>

              <View style={styles.includedList}>
                {service.whatsIncluded.map((item, idx) => (
                  <View key={idx} style={styles.includedItem}>
                    <CheckCircle2 size={16} color={Colors.success} style={{ marginTop: 2 }} />
                    <Text style={styles.includedText}>{item}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* FixNest Guarantee */}
            <View style={styles.guaranteeBox}>
              <ShieldCheck size={22} color={Colors.primary} />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.guaranteeTitle}>FixNest Quality Guarantee</Text>
                <Text style={styles.guaranteeSub}>
                  Verified service professionals, transparent estimates, & 30-day service warranty protection.
                </Text>
              </View>
            </View>

            {/* Bottom Spacing */}
            <View style={{ height: 100 }} />
          </ScrollView>

          {/* Fixed Bottom Action Bar */}
          <View style={styles.bottomBar}>
            <View style={styles.priceEstimateColumn}>
              <Text style={styles.bottomPriceLabel}>Est. Starting From</Text>
              <Text style={styles.bottomPriceValue}>
                {service.priceRange.split('(')[0]}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.bookNowBtn}
              onPress={() => setBookModalVisible(true)}
            >
              <Calendar size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
              <Text style={styles.bookNowBtnText}>Book Service</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>

      {/* Embedded Location-based Booking Flow Modal */}
      <BookServiceModal
        visible={bookModalVisible}
        onClose={() => setBookModalVisible(false)}
        serviceTitle={service.title}
      />
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  backBtn: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: Colors.background,
  },
  headerCategoryGroup: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textSecondary,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  heroCard: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 18,
    backgroundColor: 'rgba(59, 130, 246, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.25)',
  },
  heroTextContent: {
    flex: 1,
  },
  titleBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginBottom: 6,
  },
  serviceTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginRight: 8,
  },
  badgeTag: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeTagText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  serviceDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  metricCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    flexDirection: 'row',
    alignItems: 'center',
  },
  currencySymbol: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.primary,
    width: 20,
    textAlign: 'center',
  },
  metricTextWrapper: {
    marginLeft: 10,
    flex: 1,
  },
  metricLabel: {
    fontSize: 11,
    color: Colors.textMuted,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  metricValue: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: 2,
  },
  disclaimerBox: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 18,
  },
  disclaimerText: {
    fontSize: 12,
    color: Colors.textMuted,
    marginLeft: 8,
    flex: 1,
    lineHeight: 18,
  },
  sectionCard: {
    backgroundColor: Colors.surface,
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 16,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginLeft: 10,
  },
  problemsList: {
    gap: 10,
  },
  problemItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  problemDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.primary,
    marginTop: 7,
    marginRight: 10,
  },
  problemText: {
    fontSize: 14,
    color: Colors.textSecondary,
    flex: 1,
    lineHeight: 20,
  },
  includedList: {
    gap: 12,
  },
  includedItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  includedText: {
    fontSize: 14,
    color: Colors.textPrimary,
    marginLeft: 10,
    flex: 1,
    lineHeight: 20,
  },
  guaranteeBox: {
    flexDirection: 'row',
    backgroundColor: 'rgba(59, 130, 246, 0.08)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.2)',
    alignItems: 'center',
    marginBottom: 20,
  },
  guaranteeTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.primary,
  },
  guaranteeSub: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
    lineHeight: 16,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingHorizontal: 20,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  priceEstimateColumn: {
    flex: 1,
  },
  bottomPriceLabel: {
    fontSize: 11,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  bottomPriceValue: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.primary,
    marginTop: 2,
  },
  bookNowBtn: {
    flexDirection: 'row',
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  bookNowBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
});
