import { useEffect, useRef } from 'react'
import { Animated, StyleSheet, View, ScrollView, StatusBar } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import {
  ListSkeleton,
  DashboardSkeleton,
  ProfileSkeleton,
  TaskSkeleton,
  CardSkeleton,
  StaffDashboardSkeleton,
  AdminDashboardSkeleton,
  ComplaintSkeleton,
} from '../components/skeleton'

type SkeletonType = 'list' | 'dashboard' | 'profile' | 'task' | 'card' | 'staff' | 'admin' | 'complaint'

type Props = {
  loading: boolean
  skeleton?: SkeletonType
  children: React.ReactNode
  scrollable?: boolean
  padTop?: boolean
  roleReady?: boolean
}

function getSkeletonComponent(skeleton: SkeletonType) {
  switch (skeleton) {
    case 'dashboard': return <DashboardSkeleton />
    case 'staff': return <StaffDashboardSkeleton />
    case 'admin': return <AdminDashboardSkeleton />
    case 'profile': return <ProfileSkeleton />
    case 'task': return (
      <View style={{ paddingHorizontal: 16, paddingTop: 16 }}>
        <TaskSkeleton />
        <TaskSkeleton />
        <TaskSkeleton />
      </View>
    )
case 'card': return <CardSkeleton />
    case 'complaint': return (
      <View style={{ paddingHorizontal: 16, paddingTop: 16 }}>
        <ComplaintSkeleton />
        <ComplaintSkeleton />
        <ComplaintSkeleton />
        <ComplaintSkeleton />
      </View>
    )
    case 'list':
    default: return <ListSkeleton count={4} />
  }
}

export default function ScreenWrapper({
  loading,
  skeleton = 'list',
  children,
  scrollable = false,
  padTop = true,
  roleReady = true,
}: Props) {
  const insets = useSafeAreaInsets()
  const skeletonOpacity = useRef(new Animated.Value(1)).current
  const contentOpacity = useRef(new Animated.Value(0)).current
  const prevLoading = useRef(loading)

  useEffect(() => {
    if (prevLoading.current === true && loading === false) {
      Animated.parallel([
        Animated.timing(skeletonOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(contentOpacity, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start()
    }

    if (loading === true) {
      skeletonOpacity.setValue(1)
      contentOpacity.setValue(0)
    }

    prevLoading.current = loading
  }, [loading])

 // topPad available if individual screens need it via insets.top 

return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

   {/* Skeleton layer — only renders after role is known to prevent wrong skeleton flash */}
      {roleReady && (
        <Animated.View
          pointerEvents={loading ? 'auto' : 'none'}
          style={[StyleSheet.absoluteFillObject, { opacity: skeletonOpacity, zIndex: 1 }]}
        >
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
            {getSkeletonComponent(skeleton)}
          </ScrollView>
        </Animated.View>
      )}

      {/* Content layer — fades in beneath */}
      <Animated.View style={{ flex: 1, opacity: contentOpacity }}>
        {scrollable ? (
          <ScrollView showsVerticalScrollIndicator={false}>
            {children}
          </ScrollView>
        ) : (
          <View style={{ flex: 1 }}>
            {children}
          </View>
        )}
      </Animated.View>
    </View>
  ) 
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
})