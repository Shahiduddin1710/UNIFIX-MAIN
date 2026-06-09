import { Skeleton } from "moti/skeleton";
import { View } from "react-native";

export default function ComplaintSkeleton() {
  return (
    <View
      style={{
        backgroundColor: "#fff",
        borderRadius: 14,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1.5,
        borderColor: "#f1f5f9",
      }}
    >
      <View style={{ flexDirection: "row", gap: 12, marginBottom: 14 }}>
        <Skeleton colorMode="light" width={40} height={40} radius={10} />

        <View style={{ flex: 1, gap: 6 }}>
          <Skeleton colorMode="light" width="80%" height={15} radius={6} />
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
            <Skeleton colorMode="light" width={12} height={12} radius={6} />
            <Skeleton colorMode="light" width={130} height={12} radius={6} />
          </View>
          <Skeleton colorMode="light" width={110} height={12} radius={6} />
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
            <Skeleton colorMode="light" width={12} height={12} radius={6} />
            <Skeleton colorMode="light" width={90} height={12} radius={6} />
          </View>
          <Skeleton colorMode="light" width="90%" height={32} radius={6} />
        </View>

        <Skeleton colorMode="light" width={72} height={72} radius={10} />
      </View>

      <View
        style={{
          borderTopWidth: 1,
          borderTopColor: "#f1f5f9",
          paddingTop: 12,
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Skeleton colorMode="light" width={90} height={28} radius={8} />
        <Skeleton colorMode="light" width={100} height={13} radius={6} />
      </View>
    </View>
  );
}