
import React from "react";
import { View, StyleSheet } from "react-native";
import ProfileCard from "../../components/ProfileCard";

const ProfileScreen = () => {
  return (
    <View style={styles.container}>
      <ProfileCard />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
});

export default ProfileScreen;
