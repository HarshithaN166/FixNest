import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from 'react-native';
import {
  MapPin,
  Clock,
  User,
  CheckCircle2,
  XCircle,
  Briefcase,
  ChevronDown,
  ChevronUp,
  MessageSquare,
} from 'lucide-react-native';
import { Colors } from '../../constants/colors';
import { BookingRequest, BookingRequestStatus } from '../../types/professional';

interface BookingRequestCardProps {
  request: BookingRequest;
  onAccept: (id: string) => void;
  onReject: (id: string) => void;
  onOpenChat?: (request: BookingRequest) => void;
  showActions?: boolean;
}

const STATUS_CONFIG: Record<BookingRequestStatus, { color: string; label: string }> = {
  pending: { color: Colors.warning, label: 'New Request' },
  accepted: { color: Colors.success, label: 'Accepted' },
  rejected: { color: Colors.error, label: 'Declined' },
  completed: { color: Colors.primary, label: 'Completed' },
};

export const BookingRequestCard: React.FC<BookingRequestCardProps> = ({
  request,
  onAccept,
  onReject,
  onOpenChat,
  showActions = true,
}) => {
  const [expanded, setExpanded] = useState(false);
  const [responding, setResponding] = useState(false);

  const statusConf = STATUS_CONFIG[request.status];
  const isPending = request.status === 'pending';

  const handleAccept = async () => {
    setResponding(true);
    await onAccept(request.id);
    setResponding(false);
  };

  const handleReject = async () => {
    setResponding(true);
    await onReject(request.id);
    setResponding(false);
  };

  const formatTime = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return iso;
    }
  };

  return (
    <View
      style={[
        styles.card,
        isPending && styles.pendingCard,
        request.status === 'accepted' && styles.acceptedCard,
        request.status === 'rejected' && styles.rejectedCard,
        request.status === 'completed' && styles.completedCard,
      ]}
    >
      {/* Header Row */}
      <View style={styles.headerRow}>
        <TouchableOpacity
          style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}
          onPress={() => setExpanded(!expanded)}
          activeOpacity={0.75}
        >
          <View style={styles.serviceIconCircle}>
            <Briefcase size={18} color={statusConf.color} />
          </View>

          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.serviceTitle} numberOfLines={1}>
              {request.serviceTitle}
            </Text>
            <View style={styles.metaRow}>
              <User size={11} color={Colors.textMuted} />
              <Text style={styles.metaText}>{request.userName}</Text>
            </View>
          </View>
        </TouchableOpacity>

        <View style={styles.rightCol}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            {onOpenChat && (
              <TouchableOpacity
                style={styles.headerChatBtn}
                onPress={() => onOpenChat(request)}
                activeOpacity={0.8}
              >
                <MessageSquare size={15} color="#A855F7" />
              </TouchableOpacity>
            )}
            <View style={[styles.statusBadge, { backgroundColor: `${statusConf.color}22` }]}>
              <Text style={[styles.statusText, { color: statusConf.color }]}>
                {statusConf.label}
              </Text>
            </View>
          </View>
          <TouchableOpacity onPress={() => setExpanded(!expanded)} hitSlop={8}>
            {expanded ? (
              <ChevronUp size={14} color={Colors.textMuted} />
            ) : (
              <ChevronDown size={14} color={Colors.textMuted} />
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Expanded Details */}
      {expanded && (
        <View style={styles.details}>
          <View style={styles.detailRow}>
            <MapPin size={13} color={Colors.textMuted} />
            <Text style={styles.detailText}>{request.address}</Text>
          </View>
          <View style={styles.detailRow}>
            <Clock size={13} color={Colors.textMuted} />
            <Text style={styles.detailText}>
              Requested: {formatTime(request.createdAt)}
            </Text>
          </View>
          {(request.scheduledDate || request.scheduledTime) && (
            <View style={styles.detailRow}>
              <Clock size={13} color={Colors.primary} />
              <Text style={[styles.detailText, { color: Colors.primary, fontWeight: '600' }]}>
                Scheduled Appointment: {request.scheduledDate} {request.scheduledTime ? `at ${request.scheduledTime}` : ''}
              </Text>
            </View>
          )}
          {request.notes ? (
            <View style={styles.notesBox}>
              <Text style={styles.notesLabel}>Customer Notes:</Text>
              <Text style={styles.notesText}>{request.notes}</Text>
            </View>
          ) : null}

          {/* Contact info */}
          <View style={styles.contactBox}>
            <Text style={styles.contactLabel}>Customer Contact Details:</Text>
            <Text style={styles.contactPhone}>{request.userName} • {request.userPhone}</Text>
          </View>
        </View>
      )}

      {/* Action Buttons */}
      {showActions && isPending && (
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.actionBtn, styles.rejectBtn]}
            onPress={handleReject}
            disabled={responding}
            activeOpacity={0.8}
          >
            <XCircle size={16} color={Colors.error} />
            <Text style={styles.rejectText}>Decline</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, styles.acceptBtn]}
            onPress={handleAccept}
            disabled={responding}
            activeOpacity={0.8}
          >
            <CheckCircle2 size={16} color="#FFFFFF" />
            <Text style={styles.acceptText}>Accept Appointment</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Chat button for easy access */}
      {onOpenChat && (
        <TouchableOpacity
          style={styles.chatBtn}
          onPress={() => onOpenChat(request)}
          activeOpacity={0.8}
        >
          <MessageSquare size={14} color="#A855F7" />
          <Text style={styles.chatBtnText}>Chat with Customer</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surfaceCard,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  pendingCard: {
    borderColor: 'rgba(245,158,11,0.3)',
    backgroundColor: 'rgba(245,158,11,0.04)',
  },
  acceptedCard: {
    borderColor: 'rgba(16,185,129,0.3)',
    backgroundColor: 'rgba(16,185,129,0.04)',
  },
  rejectedCard: {
    borderColor: 'rgba(239,68,68,0.2)',
    opacity: 0.7,
  },
  completedCard: {
    borderColor: 'rgba(59,130,246,0.3)',
    backgroundColor: 'rgba(59,130,246,0.04)',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
  },
  serviceIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  serviceTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  metaText: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  rightCol: {
    alignItems: 'flex-end',
    gap: 4,
  },
  statusBadge: {
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  details: {
    paddingHorizontal: 14,
    paddingBottom: 12,
    gap: 6,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: 10,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 7,
  },
  detailText: {
    fontSize: 12,
    color: Colors.textSecondary,
    flex: 1,
  },
  notesBox: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 10,
    padding: 10,
    marginTop: 4,
  },
  notesLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.textMuted,
    marginBottom: 3,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  notesText: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  contactBox: {
    backgroundColor: 'rgba(16,185,129,0.08)',
    borderRadius: 10,
    padding: 10,
    marginTop: 4,
  },
  contactLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.success,
  },
  contactPhone: {
    fontSize: 13,
    color: Colors.textPrimary,
    fontWeight: '600',
    marginTop: 2,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    padding: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
  },
  rejectBtn: {
    backgroundColor: 'rgba(239,68,68,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.3)',
  },
  rejectText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.error,
  },
  acceptBtn: {
    backgroundColor: Colors.success,
    shadowColor: Colors.success,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  },
  acceptText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  headerChatBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(168,85,247,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(168,85,247,0.3)',
  },
  chatBtn: {
    marginHorizontal: 14,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(168,85,247,0.12)',
    borderRadius: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(168,85,247,0.25)',
  },
  chatBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#A855F7',
  },
});
