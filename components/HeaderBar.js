import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Modal, Linking, Alert, Switch } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { onAuthStateChanged } from "firebase/auth";
import { theme } from "../theme/theme";
import { signOutUser, auth, getAllDoctors, getUserRole, setDoctorAvailability, subscribeToAvailability } from "../services/firebase";

export default function HeaderBar({ title = "Vital Ether", showNotification = true }) {
  const navigation = useNavigation();
  const [menuVisible, setMenuVisible] = useState(false);
  const [doctorsVisible, setDoctorsVisible] = useState(false);
  const [displayName, setDisplayName] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [role, setRole] = useState(null);
  const [isAvailable, setIsAvailable] = useState(false);

  useEffect(() => {
    let availUnsub = null;
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setDisplayName(user?.displayName ?? null);
      if (user) {
        const userRole = await getUserRole(user.uid);
        setRole(userRole);
        
        if (userRole === "doctor") {
          availUnsub = subscribeToAvailability(user.uid, (available) => {
            setIsAvailable(available);
          });
        }
      } else {
        setRole(null);
        setIsAvailable(false);
      }
    });
    return () => {
      unsubscribe();
      if (availUnsub) availUnsub();
    };
  }, []);

  // Fetch real doctors from Firebase
  useEffect(() => {
    const fetchDoctors = async () => {
      const docList = await getAllDoctors();
      setDoctors(docList);
    };
    fetchDoctors();
  }, []);

  const titleText = displayName ? `Hello, ${displayName}` : title;

  const handleSignOut = () => {
    setMenuVisible(false);
    Alert.alert(
      "Sign Out",
      "Are you sure you want to sign out?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Sign Out", 
          style: "destructive",
          onPress: async () => {
            try {
              await signOutUser();
            } catch (e) {
              console.error("Sign out error", e);
            }
            navigation.reset({
              index: 0,
              routes: [{ name: "Login" }],
            });
          }
        }
      ]
    );
  };

  const handleDoctorPress = (doctor) => {
    if (doctor.phone) {
      setDoctorsVisible(false);
      Linking.openURL(`tel:${doctor.phone}`);
    }
  };

  const handleToggleAvailability = (value) => {
    if (auth.currentUser) {
      setIsAvailable(value); // Optimistic UI update
      setDoctorAvailability(auth.currentUser.uid, value).catch((e) => {
        console.error("Failed to update availability:", e);
        setIsAvailable(!value); // Revert on failure
      });
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.left}>
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Ionicons name="heart" size={16} color={theme.colors.primary} />
          </View>
        </View>
        <Text style={styles.title}>{titleText}</Text>
      </View>

      <View style={styles.right}>
        {showNotification && (
          <TouchableOpacity 
            style={styles.bellContainer}
            onPress={() => setDoctorsVisible(true)}
            activeOpacity={0.7}
          >
            <Ionicons name="notifications-outline" size={22} color={theme.colors.primary} />
          </TouchableOpacity>
        )}
        {/* Profile / Sign Out Button */}
        <TouchableOpacity
          style={styles.profileBtn}
          onPress={() => setMenuVisible(true)}
          activeOpacity={0.7}
        >
          <Ionicons name="person-circle-outline" size={28} color={theme.colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Docs Modal */}
      <Modal
        visible={doctorsVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setDoctorsVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setDoctorsVisible(false)}
        >
          <View style={styles.doctorsCard}>
            <Text style={styles.doctorsTitle}>Consulting Physicians</Text>
            {doctors.filter(d => d.available).slice(0, 1).map((doc) => (
              <TouchableOpacity 
                key={doc.id} 
                style={styles.doctorItem}
                onPress={() => handleDoctorPress(doc)}
                disabled={!doc.available}
                activeOpacity={0.7}
              >
                <View style={styles.docInfo}>
                  <Ionicons name="medical" size={16} color={doc.available ? theme.colors.primary : theme.colors.textMuted} />
                  <Text style={[styles.docName, !doc.available && { color: theme.colors.textMuted }]}>{doc.name}</Text>
                </View>
                {doc.available && (
                  <View style={styles.availableBadge}>
                    <Text style={styles.availableText}>AVAILABLE</Text>
                    <Ionicons name="checkmark-circle" size={16} color={theme.colors.accent} />
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Sign Out Modal */}
      <Modal
        visible={menuVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setMenuVisible(false)}
        >
          <View style={styles.menuCard}>
            {role === "doctor" && (
              <>
                <View style={[styles.menuItem, { justifyContent: "space-between" }]}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                    <Ionicons 
                      name={isAvailable ? "radio-button-on" : "radio-button-off"} 
                      size={20} 
                      color={isAvailable ? theme.colors.accent : theme.colors.textMuted} 
                    />
                    <View>
                      <Text style={styles.menuText}>Available to Call</Text>
                      <Text style={styles.menuSubtext}>
                        {isAvailable ? "Patients can call you" : "Hidden from Call Doctor list"}
                      </Text>
                    </View>
                  </View>
                  <Switch
                    value={isAvailable}
                    onValueChange={handleToggleAvailability}
                    trackColor={{ false: "rgba(255,255,255,0.1)", true: "rgba(79, 255, 176, 0.4)" }}
                    thumbColor={isAvailable ? theme.colors.accent : "#f4f3f4"}
                    ios_backgroundColor="rgba(255,255,255,0.1)"
                  />
                </View>
                <View style={styles.menuDivider} />
              </>
            )}
            
            <TouchableOpacity
              style={styles.menuItem}
              onPress={handleSignOut}
            >
              <Ionicons name="log-out-outline" size={20} color={theme.colors.alert} />
              <Text style={[styles.menuText, { color: theme.colors.alert }]}>Sign Out</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: theme.spacing.lg,
    paddingTop: 50,
    paddingBottom: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  left: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  right: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  avatarContainer: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(255,200,160,0.25)",
    alignItems: "center",
    justifyContent: "center",
  },
  avatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "rgba(255,200,160,0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: theme.typography.h3,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.primary,
    letterSpacing: 0.5,
  },
  bellContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  profileBtn: {
    padding: 2,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-start",
    alignItems: "flex-end",
    paddingTop: 100,
    paddingRight: theme.spacing.lg,
  },
  menuCard: {
    backgroundColor: theme.colors.backgroundLight,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingVertical: theme.spacing.sm,
    minWidth: 180,
    ...theme.shadows.soft,
  },
  doctorsCard: {
    backgroundColor: theme.colors.backgroundLight,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    minWidth: 260,
    marginRight: 45, // roughly aligning under bell icon
    ...theme.shadows.soft,
  },
  doctorsTitle: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.caption,
    fontWeight: theme.fontWeight.bold,
    marginBottom: theme.spacing.sm,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  doctorItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  docInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  docName: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.body,
    fontWeight: theme.fontWeight.medium,
  },
  availableBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(79, 255, 176, 0.1)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: theme.radius.full,
  },
  availableText: {
    color: theme.colors.accent,
    fontSize: 10,
    fontWeight: theme.fontWeight.bold,
    letterSpacing: 0.5,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: 14,
  },
  menuText: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.body,
    fontWeight: theme.fontWeight.medium,
  },
  menuSubtext: {
    color: theme.colors.textMuted,
    fontSize: 10,
    marginTop: 2,
  },
  menuDivider: {
    height: 1,
    backgroundColor: theme.colors.border,
  },
});
