import React from 'react';
import { View } from 'react-native';

import { Button } from '@/components/ui';
import { resetAllData } from '@/lib/dev-tools';

export function ResetButton() {
  return (
    <View className="absolute bottom-4 right-4 z-50">
      <Button
        label="Reset Data"
        variant="outline"
        size="sm"
        onPress={resetAllData}
        className="bg-white/70 dark:bg-neutral-800/70"
      />
    </View>
  );
}
