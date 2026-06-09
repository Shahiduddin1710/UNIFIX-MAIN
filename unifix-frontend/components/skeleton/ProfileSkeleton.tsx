import { View } from 'react-native'
import { Skeleton } from 'moti/skeleton'

export default function ProfileSkeleton() {
  return (
    <View style={{ flex: 1, paddingHorizontal: 16, paddingTop: 24, gap: 16 }}>
      <View style={{ alignItems: 'center', gap: 12, paddingVertical: 20 }}>
        <Skeleton colorMode="light" width={90} height={90} radius={45} />
        <Skeleton colorMode="light" width={140} height={20} radius={6} />
        <Skeleton colorMode="light" width={90} height={28} radius={20} />
        <Skeleton colorMode="light" width={110} height={11} radius={6} />
      </View>

      {Array(4).fill(0).map((_, i) => (
        <View key={i} style={{ backgroundColor: '#fff', borderRadius: 14, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 14, borderWidth: 1.5, borderColor: '#f1f5f9' }}>
          <Skeleton colorMode="light" width={38} height={38} radius={10} />
          <Skeleton colorMode="light" width={140} height={14} radius={6} />
        </View>
      ))}
    </View>
  )
}