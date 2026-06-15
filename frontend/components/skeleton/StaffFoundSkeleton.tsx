import { Skeleton } from "moti/skeleton";
import React from "react";
import { View } from "react-native";

export default function StaffFoundSkeleton() {
  return (
    <View style={{ flex: 1, backgroundColor: "#f8fafc" }}>
      {/* Header */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingTop: 56,
          paddingHorizontal: 20,
          paddingBottom: 14,
          backgroundColor: "#ffffff",
          borderBottomWidth: 1,
          borderBottomColor: "#f1f5f9",
        }}
      >
        <Skeleton colorMode="light" width={36} height={36} radius={10} />
        <Skeleton colorMode="light" width={100} height={18} radius={6} />
        <Skeleton colorMode="light" width={36} height={36} radius={10} />
      </View>

      {/* Segment Tabs */}
      <View
        style={{
          flexDirection: "row",
          backgroundColor: "#ffffff",
          paddingHorizontal: 16,
          paddingVertical: 10,
          borderBottomWidth: 1,
          borderBottomColor: "#f1f5f9",
          gap: 12,
        }}
      >
        <Skeleton colorMode="light" width={100} height={34} radius={8} />
        <Skeleton colorMode="light" width={100} height={34} radius={8} />
        <Skeleton colorMode="light" width={100} height={34} radius={8} />
      </View>

      {/* Cards */}
      <View style={{ padding: 14, gap: 14 }}>
        {[1, 2, 3].map((_, i) => (
          <View
            key={i}
            style={{
              backgroundColor: "#ffffff",
              borderRadius: 16,
              overflow: "hidden",
              borderWidth: 1.5,
              borderColor: "#f1f5f9",
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.05,
              shadowRadius: 8,
              elevation: 2,
            }}
          >
            {/* Card Header */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                padding: 14,
                gap: 10,
              }}
            >
              <Skeleton colorMode="light" width={38} height={38} radius={10} />
              <View style={{ flex: 1 }}>
                <Skeleton colorMode="light" width={120} height={14} radius={4} />
                <View style={{ marginTop: 6 }}>
                  <Skeleton colorMode="light" width={80} height={10} radius={4} />
                </View>
              </View>
              <Skeleton colorMode="light" width={60} height={20} radius={6} />
            </View>

            {/* Image */}
            <Skeleton colorMode="light" width="100%" height={220} radius={0} />

            {/* Card Body */}
            <View style={{ padding: 14, gap: 8 }}>
              <Skeleton colorMode="light" width="70%" height={18} radius={4} />
              <Skeleton colorMode="light" width="90%" height={14} radius={4} />
              <Skeleton colorMode="light" width="50%" height={14} radius={4} />
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginTop: 8,
                  paddingTop: 8,
                  borderTopWidth: 1,
                  borderTopColor: "#f1f5f9",
                }}
              >
                <Skeleton colorMode="light" width={100} height={14} radius={4} />
                <Skeleton colorMode="light" width={80} height={32} radius={8} />
              </View>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}