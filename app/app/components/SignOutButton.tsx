import { useClerk } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";
import { Button, Text } from "tamagui";

export const SignOutButton = () => {
  const { signOut } = useClerk();
  const router = useRouter();

  const handleSignOut = async () => {
    try {
      await signOut();
      router.replace("/(auth)/sign-in");
    } catch (err) {
      console.error(JSON.stringify(err, null, 2));
    }
  };

  return (
    <Button
      onPress={handleSignOut}
      backgroundColor="rgba(255, 255, 255, 0.2)"
      paddingHorizontal="$3"
      paddingVertical="$2"
      borderRadius="$3"
      borderWidth={1}
      borderColor="rgba(255, 255, 255, 0.5)"
      pressStyle={{ opacity: 0.7, backgroundColor: "rgba(255, 255, 255, 0.3)" }}
      height="unset"
    >
      <Text color="white" fontWeight="600" fontSize="$3">
        Sign Out
      </Text>
    </Button>
  );
};
