"use client"

import * as React from "react"
import { KeyboardAvoidingView, Platform, Animated, Easing, Dimensions } from "react-native"
import { useSignIn, useOAuth } from "@clerk/clerk-expo"
import { Link, useRouter } from "expo-router"
import * as WebBrowser from "expo-web-browser"
import { Button, Input, Label, ScrollView, Text, YStack, XStack, Separator } from "tamagui"
import { LinearGradient } from "tamagui/linear-gradient"

WebBrowser.maybeCompleteAuthSession()

const { width, height } = Dimensions.get("window")

function FloatingLeaf({
  delay,
  startX,
  startY,
  size,
  duration,
}: { delay: number; startX: number; startY: number; size: number; duration: number }) {
  const floatAnim = React.useRef(new Animated.Value(0)).current
  const opacityAnim = React.useRef(new Animated.Value(0)).current
  const rotateAnim = React.useRef(new Animated.Value(0)).current

  React.useEffect(() => {
    const animate = () => {
      floatAnim.setValue(0)
      opacityAnim.setValue(0)
      rotateAnim.setValue(0)

      Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.timing(floatAnim, {
            toValue: 1,
            duration: duration,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
          Animated.timing(rotateAnim, {
            toValue: 1,
            duration: duration,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
          Animated.sequence([
            Animated.timing(opacityAnim, {
              toValue: 0.4,
              duration: duration * 0.3,
              useNativeDriver: true,
            }),
            Animated.timing(opacityAnim, {
              toValue: 0,
              duration: duration * 0.7,
              useNativeDriver: true,
            }),
          ]),
        ]),
      ]).start(() => animate())
    }
    animate()
  }, [])

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  })

  return (
    <Animated.View
      style={{
        position: "absolute",
        left: startX,
        bottom: startY,
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: "#22c55e",
        opacity: opacityAnim,
        transform: [
          {
            translateY: floatAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [0, -height * 0.9],
            }),
          },
          {
            translateX: floatAnim.interpolate({
              inputRange: [0, 0.25, 0.5, 0.75, 1],
              outputRange: [0, 15, 0, -15, 0],
            }),
          },
          { rotate: spin },
        ],
      }}
    />
  )
}

export default function SignInScreen() {
  const { isLoaded, signIn, setActive } = useSignIn()
  const { startOAuthFlow } = useOAuth({ strategy: "oauth_google" })
  const router = useRouter()

  const [emailAddress, setEmailAddress] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [error, setError] = React.useState("")

  // Animation values
  const fadeAnim = React.useRef(new Animated.Value(0)).current
  const logoScale = React.useRef(new Animated.Value(0.3)).current
  const logoRotate = React.useRef(new Animated.Value(0)).current
  const formSlide = React.useRef(new Animated.Value(80)).current
  const buttonFade = React.useRef(new Animated.Value(0)).current
  const pulseAnim = React.useRef(new Animated.Value(1)).current
  const glowAnim = React.useRef(new Animated.Value(0)).current

  // Continuous pulse animation for logo
  React.useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.08,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    )

    const glow = Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: true,
        }),
      ]),
    )

    pulse.start()
    glow.start()
    return () => {
      pulse.stop()
      glow.stop()
    }
  }, [])

  // Initial entrance animations
  React.useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.spring(logoScale, {
          toValue: 1,
          friction: 4,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.timing(logoRotate, {
          toValue: 1,
          duration: 1000,
          easing: Easing.out(Easing.back(1.5)),
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.spring(formSlide, {
          toValue: 0,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(buttonFade, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start()
  }, [])

  const onGoogleSignIn = React.useCallback(async () => {
    try {
      const { createdSessionId, setActive: oAuthSetActive } = await startOAuthFlow()

      if (createdSessionId) {
        await oAuthSetActive!({ session: createdSessionId })
        router.replace("/(tabs)")
      }
    } catch (err: any) {
      setError(err.errors?.[0]?.message || "Google sign-in failed")
      console.error("OAuth error", err)
    }
  }, [])

  const onSignInPress = async () => {
    if (!isLoaded) return

    try {
      const signInAttempt = await signIn.create({
        identifier: emailAddress,
        password,
      })

      if (signInAttempt.status === "complete") {
        await setActive({ session: signInAttempt.createdSessionId })
        router.replace("/(tabs)")
      } else {
        console.error(JSON.stringify(signInAttempt, null, 2))
        setError("Sign in failed. Please try again.")
      }
    } catch (err: any) {
      setError(err.errors?.[0]?.message || "Invalid email or password")
      console.error(JSON.stringify(err, null, 2))
    }
  }

  const logoSpin = logoRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  })

  // Generate floating particles
  const particles = React.useMemo(() => {
    return Array.from({ length: 15 }).map((_, i) => ({
      id: i,
      delay: i * 350,
      startX: Math.random() * width,
      startY: Math.random() * 100,
      size: Math.random() * 10 + 6,
      duration: Math.random() * 5000 + 7000,
    }))
  }, [])

  return (
    <LinearGradient colors={["#f0fdf4", "#dcfce7", "#bbf7d0"]} start={[0, 0]} end={[1, 1]} style={{ flex: 1 }}>
      {/* Floating particles background */}
      {particles.map((particle) => (
        <FloatingLeaf key={particle.id} {...particle} />
      ))}

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: "center",
            paddingHorizontal: 24,
            paddingVertical: 40,
          }}
        >
          {/* Animated Logo / Header Section */}
          <Animated.View
            style={{
              opacity: fadeAnim,
              transform: [{ scale: Animated.multiply(logoScale, pulseAnim) }],
              alignItems: "center",
              marginBottom: 48,
            }}
          >
            {/* Glow effect behind logo */}
            <Animated.View
              style={{
                position: "absolute",
                width: 130,
                height: 130,
                borderRadius: 65,
                backgroundColor: "#22c55e",
                opacity: glowAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.15, 0.35],
                }),
                top: -20,
              }}
            />
            <Animated.View
              style={{
                transform: [{ rotate: logoSpin }],
              }}
            >
              <YStack
                width={90}
                height={90}
                borderRadius={45}
                alignItems="center"
                justifyContent="center"
                marginBottom={20}
                style={{
                  backgroundColor: "#22c55e",
                  shadowColor: "#22c55e",
                  shadowOffset: { width: 0, height: 8 },
                  shadowOpacity: 0.4,
                  shadowRadius: 16,
                  elevation: 12,
                }}
              >
                <Text fontSize={44} color="white">
                  ♻
                </Text>
              </YStack>
            </Animated.View>
            <Text fontSize={36} fontWeight="800" color="#166534" textAlign="center" letterSpacing={-1}>
              EcoFlow
            </Text>
            <Text fontSize={16} color="#4b5563" textAlign="center" marginTop={8} opacity={0.9}>
              Welcome back, eco warrior
            </Text>
          </Animated.View>

          {/* Error Message */}
          {error ? (
            <Animated.View style={{ opacity: fadeAnim }}>
              <YStack
                backgroundColor="rgba(239, 68, 68, 0.1)"
                paddingVertical={14}
                paddingHorizontal={18}
                borderRadius={14}
                marginBottom={20}
                borderWidth={1}
                borderColor="rgba(239, 68, 68, 0.2)"
              >
                <Text color="#dc2626" textAlign="center" fontSize={14} fontWeight="500">
                  {error}
                </Text>
              </YStack>
            </Animated.View>
          ) : null}

          {/* Form Section */}
          <Animated.View
            style={{
              opacity: fadeAnim,
              transform: [{ translateY: formSlide }],
            }}
          >
            <YStack space="$4" marginBottom={24}>
              <YStack space="$2">
                <Label color="#374151" fontSize={14} fontWeight="600">
                  Email Address
                </Label>
                <Input
                  autoCapitalize="none"
                  value={emailAddress}
                  placeholder="you@example.com"
                  placeholderTextColor="#9ca3af"
                  onChangeText={(email: string) => {
                    setEmailAddress(email)
                    setError("")
                  }}
                  keyboardType="email-address"
                  backgroundColor="white"
                  borderWidth={2}
                  borderColor="#e5e7eb"
                  borderRadius={16}
                  height={58}
                  paddingHorizontal={20}
                  color="#1f2937"
                  fontSize={16}
                  focusStyle={{
                    borderColor: "#22c55e",
                    backgroundColor: "white",
                  }}
                  style={{
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.05,
                    shadowRadius: 8,
                    elevation: 2,
                  }}
                />
              </YStack>

              <YStack space="$2">
                <Label color="#374151" fontSize={14} fontWeight="600">
                  Password
                </Label>
                <Input
                  value={password}
                  placeholder="Enter your password"
                  placeholderTextColor="#9ca3af"
                  secureTextEntry={true}
                  onChangeText={(pass: string) => {
                    setPassword(pass)
                    setError("")
                  }}
                  backgroundColor="white"
                  borderWidth={2}
                  borderColor="#e5e7eb"
                  borderRadius={16}
                  height={58}
                  paddingHorizontal={20}
                  color="#1f2937"
                  fontSize={16}
                  focusStyle={{
                    borderColor: "#22c55e",
                    backgroundColor: "white",
                  }}
                  style={{
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.05,
                    shadowRadius: 8,
                    elevation: 2,
                  }}
                />
              </YStack>
            </YStack>
          </Animated.View>

          {/* Buttons Section */}
          <Animated.View style={{ opacity: buttonFade }}>
            <YStack space="$4">
              <Button
                backgroundColor="#22c55e"
                color="white"
                onPress={onSignInPress}
                disabled={!emailAddress || !password}
                opacity={!emailAddress || !password ? 0.6 : 1}
                height={58}
                borderRadius={16}
                fontSize={17}
                fontWeight="700"
                pressStyle={{
                  backgroundColor: "#16a34a",
                  scale: 0.97,
                }}
                animation="quick"
                style={{
                  shadowColor: "#22c55e",
                  shadowOffset: { width: 0, height: 6 },
                  shadowOpacity: 0.35,
                  shadowRadius: 12,
                  elevation: 8,
                }}
              >
                Sign In
              </Button>

              <XStack alignItems="center" space="$3" marginVertical={12}>
                <Separator backgroundColor="#d1d5db" />
                <Text color="#6b7280" fontSize={13} fontWeight="500">
                  or continue with
                </Text>
                <Separator backgroundColor="#d1d5db" />
              </XStack>

              <Button
                backgroundColor="white"
                borderColor="#e5e7eb"
                borderWidth={2}
                onPress={onGoogleSignIn}
                color="#374151"
                height={58}
                borderRadius={16}
                fontSize={16}
                fontWeight="600"
                pressStyle={{
                  backgroundColor: "#f9fafb",
                  scale: 0.97,
                }}
                animation="quick"
                style={{
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.06,
                  shadowRadius: 8,
                  elevation: 3,
                }}
                icon={
                  <XStack
                    width={26}
                    height={26}
                    borderRadius={13}
                    backgroundColor="#f3f4f6"
                    alignItems="center"
                    justifyContent="center"
                    marginRight={10}
                  >
                    <Text color="#4285F4" fontWeight="bold" fontSize={15}>
                      G
                    </Text>
                  </XStack>
                }
              >
                Continue with Google
              </Button>

              <XStack justifyContent="center" space="$2" marginTop={28} paddingBottom={20}>
                <Text color="#6b7280" fontSize={15}>
                  Don't have an account?
                </Text>
                <Link href="/(auth)/sign-up" asChild>
                  <Text color="#22c55e" fontWeight="700" fontSize={15} pressStyle={{ opacity: 0.7 }}>
                    Sign Up
                  </Text>
                </Link>
              </XStack>
            </YStack>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  )
}
