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
import { registerUser, saveUserRole } from "../services/firebase";

export default function RegisterScreen({ navigation }) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [selectedRole, setSelectedRole] = useState("patient");
  const [phone, setPhone] = useState("");

  // Validation States
  const [nameError, setNameError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [confirmError, setConfirmError] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // ─── Validators ───
  const validateName = (text) => {
    if (!text || text.trim().length === 0) {
      setNameError("Full name is required");
      return false;
    }
    if (text.trim().length < 2) {
      setNameError("Name must be at least 2 characters");
      return false;
    }
    setNameError("");
    return true;
  };

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
    if (text.length < 6) {
      setPasswordError("Password must be at least 6 characters");
      return false;
    }
    setPasswordError("");
    return true;
  };

  const validateConfirm = (text) => {
    if (!text) {
      setConfirmError("Please confirm your password");
      return false;
    }
    if (text !== password) {
      setConfirmError("Passwords do not match");
      return false;
    }
    setConfirmError("");
    return true;
  };

  // ─── Live change handlers ───
  const handleNameChange = (text) => {
    setFullName(text);
    if (text.length > 0 || nameError) validateName(text);
    else setNameError("");
  };

  const handleEmailChange = (text) => {
    setEmail(text);
    if (text.length > 0 || emailError) validateEmail(text);
    else setEmailError("");
  };

  const handlePasswordChange = (text) => {
    setPassword(text);
    if (text.length > 0 || passwordError) validatePassword(text);
    else setPasswordError("");
    // Re-validate confirm if it was already filled
    if (confirmPassword.length > 0) {
      if (text !== confirmPassword) setConfirmError("Passwords do not match");
      else setConfirmError("");
    }
  };

  const handleConfirmChange = (text) => {
    setConfirmPassword(text);
    if (text.length > 0 || confirmError) validateConfirm(text);
    else setConfirmError("");
  };

  const validatePhone = (text) => {
    if (selectedRole !== "doctor") return true;
    const digits = text.replace(/\D/g, "");
    if (!digits || digits.length < 10) {
      setPhoneError("Enter a valid 10-digit phone number");
      return false;
    }
    setPhoneError("");
    return true;
  };

  const handlePhoneChange = (text) => {
    setPhone(text);
    if (text.length > 0 || phoneError) validatePhone(text);
    else setPhoneError("");
  };

  const isFormValid =
    fullName.trim().length >= 2 &&
    email.length > 0 &&
    password.length >= 6 &&
    confirmPassword === password &&
    agreeTerms &&
    !nameError &&
    !emailError &&
    !passwordError &&
    !confirmError &&
    (selectedRole !== "doctor" || (phone.replace(/\D/g, "").length >= 10 && !phoneError));

  // ─── Firebase Registration ───
  const handleRegister = async () => {
    const isNameValid = validateName(fullName);
    const isEmailValid = validateEmail(email);
    const isPasswordValid = validatePassword(password);
    const isConfirmValid = validateConfirm(confirmPassword);

    if (!agreeTerms) {
      Alert.alert("Terms Required", "Please agree to the terms & conditions.");
      return;
    }

    if (isNameValid && isEmailValid && isPasswordValid && isConfirmValid) {
      if (selectedRole === "doctor" && !validatePhone(phone)) return;
      setIsLoading(true);
      try {
        const user = await registerUser(email, password, fullName.trim());
        const extraData = selectedRole === "doctor" 
          ? { phone: phone.trim(), displayName: fullName.trim() } 
          : { displayName: fullName.trim() };
        await saveUserRole(user.uid, selectedRole, extraData);
        Alert.alert(
          "Account Created",
          "Your account has been created successfully!",
          [
            {
              text: "Sign In",
              onPress: () => navigation.replace("Login"),
            },
          ]
        );
      } catch (error) {
        console.error("Registration error:", error.code, error.message);
        let message = "Registration failed. Please try again.";
        if (error.code === "auth/email-already-in-use") {
          message = "This email is already registered. Try signing in instead.";
        } else if (error.code === "auth/invalid-email") {
          message = "The email address is not valid.";
        } else if (error.code === "auth/weak-password") {
          message = "Password is too weak. Use at least 6 characters.";
        }
        Alert.alert("Registration Error", message);
      } finally {
        setIsLoading(false);
      }
    }
  };

  // ─── Password strength indicator ───
  const getPasswordStrength = () => {
    if (password.length === 0) return { label: "", color: "transparent", width: "0%" };
    if (password.length < 6) return { label: "WEAK", color: theme.colors.alert, width: "25%" };
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecial = /[^A-Za-z0-9]/.test(password);
    const score = [hasUpper, hasLower, hasNumber, hasSpecial].filter(Boolean).length;
    if (score <= 1) return { label: "FAIR", color: theme.colors.warning, width: "50%" };
    if (score <= 2) return { label: "GOOD", color: theme.colors.primary, width: "75%" };
    return { label: "STRONG", color: theme.colors.accent, width: "100%" };
  };

  const strength = getPasswordStrength();

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
            <Ionicons name="person-add" size={34} color={theme.colors.primary} />
          </View>
          <Text style={styles.appName}>Create Account</Text>
          <Text style={styles.tagline}>
            JOIN THE SANCTUARY • SECURE{"\n"}REGISTRATION
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

        {/* Doctor Phone Number (only visible for doctor role) */}
        {selectedRole === "doctor" && (
          <View style={[styles.card, {marginBottom: 0, paddingBottom: 16}]}>
            <Text style={styles.inputLabel}>CONTACT NUMBER</Text>
            <View
              style={[
                styles.inputContainer,
                phoneError ? styles.inputErrorBorder : null,
                phoneError ? { marginBottom: 4 } : null,
              ]}
            >
              <Ionicons
                name="call"
                size={18}
                color={phoneError ? theme.colors.alert : theme.colors.textMuted}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="10-digit phone number"
                placeholderTextColor={theme.colors.textMuted}
                value={phone}
                onChangeText={handlePhoneChange}
                onBlur={() => validatePhone(phone)}
                keyboardType="phone-pad"
                maxLength={15}
              />
            </View>
            {phoneError ? <Text style={styles.errorText}>{phoneError}</Text> : null}
            <Text style={{color: theme.colors.textMuted, fontSize: 12, marginTop: 6}}>
              Patients will see this number when you send a notification
            </Text>
          </View>
        )}

        {/* Registration Card */}
        <View style={styles.card}>
          {/* Full Name */}
          <Text style={styles.inputLabel}>FULL NAME</Text>
          <View
            style={[
              styles.inputContainer,
              nameError ? styles.inputErrorBorder : null,
              nameError ? { marginBottom: theme.spacing.sm } : null,
            ]}
          >
            <Ionicons
              name="person"
              size={18}
              color={nameError ? theme.colors.alert : theme.colors.textMuted}
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              placeholder="John Doe"
              placeholderTextColor={theme.colors.textMuted}
              value={fullName}
              onChangeText={handleNameChange}
              onBlur={() => validateName(fullName)}
              autoCapitalize="words"
            />
          </View>
          {nameError ? <Text style={styles.errorText}>{nameError}</Text> : null}

          {/* Email Field */}
          <Text style={styles.inputLabel}>MEDICAL ID / EMAIL</Text>
          <View
            style={[
              styles.inputContainer,
              emailError ? styles.inputErrorBorder : null,
              emailError ? { marginBottom: theme.spacing.sm } : null,
            ]}
          >
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
          <Text style={styles.inputLabel}>CREATE ACCESS KEY</Text>
          <View
            style={[
              styles.inputContainer,
              passwordError ? styles.inputErrorBorder : null,
              passwordError ? { marginBottom: theme.spacing.sm } : null,
            ]}
          >
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
          {passwordError ? (
            <Text style={styles.errorText}>{passwordError}</Text>
          ) : null}

          {/* Password Strength Meter */}
          {password.length > 0 && (
            <View style={styles.strengthContainer}>
              <View style={styles.strengthBarOuter}>
                <View
                  style={[
                    styles.strengthBarInner,
                    { width: strength.width, backgroundColor: strength.color },
                  ]}
                />
              </View>
              <Text style={[styles.strengthLabel, { color: strength.color }]}>
                {strength.label}
              </Text>
            </View>
          )}

          {/* Confirm Password Field */}
          <Text style={styles.inputLabel}>CONFIRM ACCESS KEY</Text>
          <View
            style={[
              styles.inputContainer,
              confirmError ? styles.inputErrorBorder : null,
              confirmError ? { marginBottom: theme.spacing.sm } : null,
            ]}
          >
            <Ionicons
              name="lock-open"
              size={18}
              color={confirmError ? theme.colors.alert : theme.colors.textMuted}
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              placeholder="••••••••"
              placeholderTextColor={theme.colors.textMuted}
              value={confirmPassword}
              onChangeText={handleConfirmChange}
              onBlur={() => validateConfirm(confirmPassword)}
              secureTextEntry={!showConfirm}
            />
            <TouchableOpacity
              onPress={() => setShowConfirm(!showConfirm)}
              style={styles.eyeBtn}
            >
              <Ionicons
                name={showConfirm ? "eye-off" : "eye"}
                size={20}
                color={theme.colors.textMuted}
              />
            </TouchableOpacity>
          </View>
          {confirmError ? (
            <Text style={styles.errorText}>{confirmError}</Text>
          ) : null}

          {/* Terms Agreement */}
          <TouchableOpacity
            style={styles.checkRow}
            onPress={() => setAgreeTerms(!agreeTerms)}
            activeOpacity={0.7}
          >
            <View
              style={[styles.checkbox, agreeTerms && styles.checkboxActive]}
            >
              {agreeTerms && (
                <Ionicons name="checkmark" size={14} color="#0A0F1C" />
              )}
            </View>
            <Text style={styles.checkLabel}>
              I agree to the{" "}
              <Text style={styles.termsLink}>Terms & Conditions</Text>
            </Text>
          </TouchableOpacity>

          {/* Register Button */}
          <TouchableOpacity
            style={[
              styles.registerBtn,
              (!isFormValid || isLoading) && styles.registerBtnDisabled,
            ]}
            onPress={handleRegister}
            disabled={!isFormValid || isLoading}
            activeOpacity={0.8}
          >
            {isLoading ? (
              <ActivityIndicator color="#0A0F1C" />
            ) : (
              <>
                <Text style={styles.registerText}>Create Account</Text>
                <Ionicons name="arrow-forward" size={22} color="#0A0F1C" />
              </>
            )}
          </TouchableOpacity>

          {/* Sign In Link */}
          <View style={styles.signInRow}>
            <Text style={styles.signInText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate("Login")}>
              <Text style={styles.signInLink}>Sign In</Text>
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
    paddingTop: 50,
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
    fontSize: 32,
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

  // Password Strength
  strengthContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: theme.spacing.lg,
    gap: 10,
  },
  strengthBarOuter: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.08)",
    overflow: "hidden",
  },
  strengthBarInner: {
    height: "100%",
    borderRadius: 2,
  },
  strengthLabel: {
    fontSize: theme.typography.micro,
    fontWeight: theme.fontWeight.bold,
    letterSpacing: 2,
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
    flex: 1,
  },
  termsLink: {
    color: theme.colors.primary,
    fontWeight: theme.fontWeight.bold,
  },

  // Register Button
  registerBtn: {
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
  registerBtnDisabled: {
    opacity: 0.5,
  },
  registerText: {
    color: "#0A0F1C",
    fontSize: theme.typography.h3,
    fontWeight: theme.fontWeight.bold,
  },

  // Sign In Link
  signInRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  signInText: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.body,
  },
  signInLink: {
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
