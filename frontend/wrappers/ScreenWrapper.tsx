import AsyncStorage from '@react-native-async-storage/async-storage'
import { Skeleton } from 'moti/skeleton'
import { useEffect, useRef } from 'react'
import { Animated, ScrollView, StatusBar, StyleSheet, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import {
  AdminDashboardSkeleton,
  CardSkeleton,
  ComplaintSkeleton,
  DashboardSkeleton,
  ListSkeleton,
  ProfileSkeleton,
  StaffDashboardSkeleton,
  TaskSkeleton,
} from '../components/skeleton'
import { useLoadingStore } from '../store/loadingStore'

type SkeletonType = 'list' | 'dashboard' | 'profile' | 'task' | 'card' | 'staff' | 'admin' | 'complaint' | 'staffFound' | 'none';

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
      <View>
        <View style={{ paddingHorizontal: 20, paddingVertical: 14, backgroundColor: '#ffffff', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' }}>
          <Skeleton colorMode="light" width={140} height={17} radius={6} />
        </View>
        <View style={{ flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 12, gap: 8, backgroundColor: '#ffffff', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' }}>
          <Skeleton colorMode="light" width={60} height={34} radius={20} />
          <Skeleton colorMode="light" width={75} height={34} radius={20} />
          <Skeleton colorMode="light" width={80} height={34} radius={20} />
        </View>
        <View style={{ paddingHorizontal: 16, paddingTop: 16 }}>
          <ComplaintSkeleton />
          <ComplaintSkeleton />
          <ComplaintSkeleton />
          <ComplaintSkeleton />
        </View>
      </View>
    )
   case 'none': return <View />
    case 'list':
    default: return <ListSkeleton count={4} />
  }
}

const loadedScreens = new Set<string>()

function persistLoadedScreens() {
  AsyncStorage.setItem('unifix_loaded_screens', JSON.stringify([...loadedScreens])).catch(() => {})
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
  // Check loadedScreens only if AsyncStorage has already been read
const { isLoaded: isScreenLoaded } = useLoadingStore()
const skipSkeleton = skeleton === 'none'
  const alreadyLoaded = skipSkeleton || loadedScreens.has(skeleton) || isScreenLoaded(`screen_${skeleton}`)
  const skeletonOpacity = useRef(new Animated.Value(alreadyLoaded ? 0 : 1)).current
  const contentOpacity = useRef(new Animated.Value(alreadyLoaded ? 1 : 0)).current
  const prevLoading = useRef(loading)
  const hasLoadedOnce = useRef(alreadyLoaded)

useEffect(() => {
  if (!loading) {
    skeletonOpacity.setValue(0)
    contentOpacity.setValue(1)
    hasLoadedOnce.current = true
  }
}, [])

useEffect(() => {
if (loading === false && !hasLoadedOnce.current) {
      hasLoadedOnce.current = true
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
      return
    }

if (prevLoading.current === true && loading === false) {
    hasLoadedOnce.current = true
      loadedScreens.add(skeleton)
      persistLoadedScreens()
      useLoadingStore.getState().markLoaded(`screen_${skeleton}`)
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

if (loading === true && !hasLoadedOnce.current) {
      skeletonOpacity.setValue(1)
      contentOpacity.setValue(0)
    }

    // If already loaded once, never hide content again, show stale content
    // while fresh data loads silently in background
    if (loading === true && hasLoadedOnce.current) {
      skeletonOpacity.setValue(0)
      contentOpacity.setValue(1)
    }

    prevLoading.current = loading
  }, [loading])

return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

   
<Animated.View
        pointerEvents={loading && !hasLoadedOnce.current ? 'auto' : 'none'}
        style={[StyleSheet.absoluteFillObject, { opacity: skeletonOpacity, zIndex: 1 }]}
      >
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
          {getSkeletonComponent(skeleton)}
        </ScrollView>
      </Animated.View>
  
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
    backgroundColor: 'white',
  },
})