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
      size="$3"
      backgroundColor="#fee2e2"
      borderColor="#fecaca"
      borderWidth={1}
      pressStyle={{ scale: 0.95, backgroundColor: "#fecaca" }}
      onPress={handleSignOut}
      paddingHorizontal="$3"
    >
      <Text color="#dc2626" fontWeight="600" fontSize="$3">
        Sign Out
      </Text>
    </Button>
  );
};
