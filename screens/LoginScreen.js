import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "../theme/theme";
import { loginUser, getUserRole } from "../services/firebase";

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [secureSession, setSecureSession] = useState(false);
  const [selectedRole, setSelectedRole] = useState("patient");
  
  // Validation States
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const validateEmail = (text) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!text) {
      setEmailError("Email is required");
      return false;
    } else if (!regex.test(text)) {
      setEmailError("Enter a valid email address");
      return false;
    }
    setEmailError("");
    return true;
  };

  const validatePassword = (text) => {
    if (!text) {
      setPasswordError("Password is required");
      return false;
    }
    setPasswordError("");
    return true;
  };

  const handleEmailChange = (text) => {
    setEmail(text);
    if (text.length > 0 || emailError) {
      validateEmail(text);
    } else {
      setEmailError("");
    }
  };

  const handlePasswordChange = (text) => {
    setPassword(text);
    if (text.length > 0 || passwordError) {
      validatePassword(text);
    } else {
      setPasswordError("");
    }
  };

  const isFormValid = email.length > 0 && password.length > 0 && !emailError && !passwordError;

  const handleSignIn = async () => {
    const isEmailValid = validateEmail(email);
    const isPasswordValid = validatePassword(password);

    if (isEmailValid && isPasswordValid) {
      setIsLoading(true);
      try {
        const user = await loginUser(email, password);
        // Verify user role matches selected toggle
        const storedRole = await getUserRole(user.uid);
        if (storedRole && storedRole !== selectedRole) {
          Alert.alert(
            "Wrong Portal",
            `This account is registered as a ${storedRole}. Please select the correct role.`
          );
          return;
        }
        navigation.replace(selectedRole === "doctor" ? "DoctorTabs" : "PatientTabs");
      } catch (error) {
        let message = "Sign in failed. Please try again.";
        if (error.code === "auth/user-not-found") {
          message = "No account found with this email.";
        } else if (error.code === "auth/wrong-password" || error.code === "auth/invalid-credential") {
          message = "Incorrect password. Please try again.";
        } else if (error.code === "auth/invalid-email") {
          message = "The email address is not valid.";
        } else if (error.code === "auth/too-many-requests") {
          message = "Too many failed attempts. Please try again later.";
        }
        Alert.alert("Sign In Error", message);
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header / Branding */}
        <View style={styles.branding}>
          <View style={styles.iconOuter}>
            <Ionicons name="heart" size={36} color={theme.colors.primary} />
          </View>
          <Text style={styles.appName}>Vital Ether</Text>
          <Text style={styles.tagline}>
            DIGITAL SANCTUARY • CLINICAL{"\n"}MONITORING
          </Text>
        </View>

        {/* Role Toggle */}
        <View style={styles.roleToggleContainer}>
          <TouchableOpacity
            style={[styles.roleToggleBtn, selectedRole === "patient" && styles.roleToggleBtnActive]}
            onPress={() => setSelectedRole("patient")}
            activeOpacity={0.75}
          >
            <Ionicons name="person" size={16} color={selectedRole === "patient" ? "#0A0F1C" : theme.colors.textSecondary} />
            <Text style={[styles.roleToggleText, selectedRole === "patient" && styles.roleToggleTextActive]}>Patient</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.roleToggleBtn, selectedRole === "doctor" && styles.roleToggleBtnActive]}
            onPress={() => setSelectedRole("doctor")}
            activeOpacity={0.75}
          >
            <Ionicons name="medkit" size={16} color={selectedRole === "doctor" ? "#0A0F1C" : theme.colors.textSecondary} />
            <Text style={[styles.roleToggleText, selectedRole === "doctor" && styles.roleToggleTextActive]}>Doctor</Text>
          </TouchableOpacity>
        </View>

        {/* Login Card */}
        <View style={styles.card}>
          {/* Email Field */}
          <Text style={styles.inputLabel}>MEDICAL ID / EMAIL</Text>
          <View style={[styles.inputContainer, emailError ? styles.inputErrorBorder : null, emailError ? { marginBottom: theme.spacing.sm } : null]}>
            <Ionicons
              name="at"
              size={20}
              color={emailError ? theme.colors.alert : theme.colors.textMuted}
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              placeholder="name@vitalether.com"
              placeholderTextColor={theme.colors.textMuted}
              value={email}
              onChangeText={handleEmailChange}
              onBlur={() => validateEmail(email)}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>
          {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}

          {/* Password Field */}
          <View style={styles.passwordHeader}>
            <Text style={styles.inputLabel}>ACCESS KEY</Text>
            <TouchableOpacity>
              <Text style={styles.forgotText}>Forgot Password?</Text>
            </TouchableOpacity>
          </View>
          <View style={[styles.inputContainer, passwordError ? styles.inputErrorBorder : null, passwordError ? { marginBottom: theme.spacing.sm } : null]}>
            <Ionicons
              name="lock-closed"
              size={18}
              color={passwordError ? theme.colors.alert : theme.colors.textMuted}
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              placeholder="••••••••"
              placeholderTextColor={theme.colors.textMuted}
              value={password}
              onChangeText={handlePasswordChange}
              onBlur={() => validatePassword(password)}
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity
              onPress={() => setShowPassword(!showPassword)}
              style={styles.eyeBtn}
            >
              <Ionicons
                name={showPassword ? "eye-off" : "eye"}
                size={20}
                color={theme.colors.textMuted}
              />
            </TouchableOpacity>
          </View>
          {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}

          {/* Secure Session */}
          <TouchableOpacity
            style={styles.checkRow}
            onPress={() => setSecureSession(!secureSession)}
            activeOpacity={0.7}
          >
            <View
              style={[
                styles.checkbox,
                secureSession && styles.checkboxActive,
              ]}
            >
              {secureSession && (
                <Ionicons name="checkmark" size={14} color="#0A0F1C" />
              )}
            </View>
            <Text style={styles.checkLabel}>Secure session storage</Text>
          </TouchableOpacity>

          {/* Sign In Button */}
          <TouchableOpacity
            style={[
              styles.signInBtn,
              (!isFormValid || isLoading) && styles.signInBtnDisabled
            ]}
            onPress={handleSignIn}
            disabled={!isFormValid || isLoading}
            activeOpacity={0.8}
          >
            {isLoading ? (
              <ActivityIndicator color="#0A0F1C" />
            ) : (
              <>
                <Text style={styles.signInText}>Sign In</Text>
                <Ionicons name="arrow-forward" size={22} color="#0A0F1C" />
              </>
            )}
          </TouchableOpacity>

          {/* Create Account */}
          <View style={styles.createRow}>
            <Text style={styles.createText}>New to the sanctuary? </Text>
            <TouchableOpacity onPress={() => navigation.navigate("Register")}>
              <Text style={styles.createLink}>Create Account</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Footer Security */}
        <View style={styles.footer}>
          <View style={styles.securityRow}>
            <View style={styles.securityItem}>
              <Ionicons
                name="shield-checkmark"
                size={16}
                color={theme.colors.textMuted}
              />
              <Text style={styles.securityText}>256-BIT AES</Text>
            </View>
            <View style={styles.securityItem}>
              <Ionicons
                name="shield"
                size={16}
                color={theme.colors.textMuted}
              />
              <Text style={styles.securityText}>HIPAA COMPLIANT</Text>
            </View>
          </View>
          <Text style={styles.disclaimer}>
            PROPRIETARY CLINICAL MONITORING{"\n"}SOFTWARE.{"\n"}
            UNAUTHORIZED ACCESS IS STRICTLY{"\n"}PROHIBITED.
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: 60,
    paddingBottom: 40,
  },

  // Role Toggle
  roleToggleContainer: {
    flexDirection: "row",
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.lg,
  },
  roleToggleBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: "transparent",
  },
  roleToggleBtnActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  roleToggleText: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.body,
    fontWeight: theme.fontWeight.bold,
  },
  roleToggleTextActive: {
    color: "#0A0F1C",
  },

  // Branding
  branding: {
    alignItems: "center",
    marginBottom: theme.spacing.xl,
  },
  iconOuter: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(100, 100, 120, 0.25)",
    borderWidth: 2,
    borderColor: "rgba(0, 229, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: theme.spacing.md,
    ...theme.shadows.glow,
  },
  appName: {
    fontSize: 36,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.primary,
    letterSpacing: 1,
    marginBottom: theme.spacing.sm,
  },
  tagline: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.caption,
    letterSpacing: 3,
    fontWeight: theme.fontWeight.semibold,
    textAlign: "center",
    lineHeight: 20,
  },

  // Card
  card: {
    backgroundColor: "rgba(255,255,255,0.03)",
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
  },

  // Input
  inputLabel: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.caption,
    fontWeight: theme.fontWeight.bold,
    letterSpacing: 2,
    marginBottom: theme.spacing.sm,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.3)",
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: theme.spacing.lg,
    paddingHorizontal: theme.spacing.md,
    height: 52,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    color: theme.colors.textPrimary,
    fontSize: theme.typography.body,
  },
  inputErrorBorder: {
    borderColor: theme.colors.alert,
    borderWidth: 1,
  },
  errorText: {
    color: theme.colors.alert,
    fontSize: theme.typography.micro,
    marginBottom: theme.spacing.md,
    marginLeft: 4,
  },
  eyeBtn: {
    padding: 4,
  },

  // Password Header
  passwordHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing.sm,
  },
  forgotText: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.caption,
    fontWeight: theme.fontWeight.medium,
  },

  // Checkbox
  checkRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: theme.spacing.lg,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: theme.colors.textMuted,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  checkLabel: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.body,
  },

  // Sign In
  signInBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.md,
    paddingVertical: 18,
    gap: 10,
    marginBottom: theme.spacing.lg,
    ...theme.shadows.glow,
  },
  signInBtnDisabled: {
    opacity: 0.5,
  },
  signInText: {
    color: "#0A0F1C",
    fontSize: theme.typography.h3,
    fontWeight: theme.fontWeight.bold,
  },

  // Create Account
  createRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  createText: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.body,
  },
  createLink: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.body,
    fontWeight: theme.fontWeight.bold,
  },

  // Footer
  footer: {
    alignItems: "center",
  },
  securityRow: {
    flexDirection: "row",
    gap: theme.spacing.xl,
    marginBottom: theme.spacing.md,
  },
  securityItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  securityText: {
    color: theme.colors.textMuted,
    fontSize: theme.typography.micro,
    fontWeight: theme.fontWeight.bold,
    letterSpacing: 2,
  },
  disclaimer: {
    color: theme.colors.textMuted,
    fontSize: theme.typography.micro,
    letterSpacing: 1.5,
    textAlign: "center",
    lineHeight: 16,
  },
});
