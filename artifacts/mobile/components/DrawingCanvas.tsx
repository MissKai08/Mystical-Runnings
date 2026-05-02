import React, { useRef, useState, useImperativeHandle, forwardRef } from "react";
import { View, PanResponder, StyleSheet, Pressable, Text } from "react-native";
import Svg, { Path } from "react-native-svg";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";

export interface DrawingCanvasRef {
  getPaths: () => string[];
  clear: () => void;
}

interface Props {
  width: number;
  height: number;
  strokeColor?: string;
  strokeWidth?: number;
}

function pointsToPath(points: [number, number][]): string {
  if (points.length === 0) return "";
  if (points.length === 1) {
    const [x, y] = points[0];
    return `M ${x},${y} L ${x + 0.1},${y + 0.1}`;
  }
  const [start, ...rest] = points;
  return `M ${start[0]},${start[1]} ` + rest.map(([x, y]) => `L ${x},${y}`).join(" ");
}

export const DrawingCanvas = forwardRef<DrawingCanvasRef, Props>(function DrawingCanvas(
  { width, height, strokeColor = "#D4A843", strokeWidth = 2.5 },
  ref
) {
  const colors = useColors();
  const [completedPaths, setCompletedPaths] = useState<string[]>([]);
  const [currentPoints, setCurrentPoints] = useState<[number, number][]>([]);
  const currentPointsRef = useRef<[number, number][]>([]);
  const completedPathsRef = useRef<string[]>([]);

  useImperativeHandle(ref, () => ({
    getPaths: () => completedPathsRef.current,
    clear: () => {
      completedPathsRef.current = [];
      currentPointsRef.current = [];
      setCompletedPaths([]);
      setCurrentPoints([]);
    },
  }));

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        const { locationX, locationY } = evt.nativeEvent;
        const point: [number, number] = [Math.round(locationX), Math.round(locationY)];
        currentPointsRef.current = [point];
        setCurrentPoints([point]);
      },
      onPanResponderMove: (evt) => {
        const { locationX, locationY } = evt.nativeEvent;
        const point: [number, number] = [Math.round(locationX), Math.round(locationY)];
        currentPointsRef.current = [...currentPointsRef.current, point];
        setCurrentPoints((prev) => [...prev, point]);
      },
      onPanResponderRelease: () => {
        const pathStr = pointsToPath(currentPointsRef.current);
        if (pathStr) {
          const newPaths = [...completedPathsRef.current, pathStr];
          completedPathsRef.current = newPaths;
          setCompletedPaths(newPaths);
        }
        currentPointsRef.current = [];
        setCurrentPoints([]);
      },
      onPanResponderTerminate: () => {
        currentPointsRef.current = [];
        setCurrentPoints([]);
      },
    })
  ).current;

  const handleUndo = () => {
    const newPaths = completedPathsRef.current.slice(0, -1);
    completedPathsRef.current = newPaths;
    setCompletedPaths(newPaths);
  };

  const handleClear = () => {
    completedPathsRef.current = [];
    currentPointsRef.current = [];
    setCompletedPaths([]);
    setCurrentPoints([]);
  };

  const currentPath = pointsToPath(currentPoints);

  return (
    <View style={styles.wrapper}>
      {/* Toolbar */}
      <View style={[styles.toolbar, { borderBottomColor: colors.border }]}>
        <Pressable
          onPress={handleUndo}
          disabled={completedPaths.length === 0}
          style={[styles.toolBtn, { opacity: completedPaths.length === 0 ? 0.3 : 1 }]}
        >
          <Feather name="corner-up-left" size={18} color={colors.foreground} />
          <Text style={[styles.toolLabel, { color: colors.mutedForeground }]}>Undo</Text>
        </Pressable>
        <View style={styles.toolbarCenter}>
          <Text style={[styles.strokeCount, { color: colors.mutedForeground }]}>
            {completedPaths.length === 0 ? "Draw your reflection below" : `${completedPaths.length} stroke${completedPaths.length === 1 ? "" : "s"}`}
          </Text>
        </View>
        <Pressable
          onPress={handleClear}
          disabled={completedPaths.length === 0}
          style={[styles.toolBtn, { opacity: completedPaths.length === 0 ? 0.3 : 1 }]}
        >
          <Feather name="trash-2" size={18} color="#F97316" />
          <Text style={[styles.toolLabel, { color: colors.mutedForeground }]}>Clear</Text>
        </Pressable>
      </View>

      {/* Canvas */}
      <View
        {...panResponder.panHandlers}
        style={[styles.canvas, { width, height, backgroundColor: "#0D0B1E" }]}
      >
        {/* Subtle grid lines for guidance */}
        <Svg width={width} height={height} style={StyleSheet.absoluteFill} pointerEvents="none">
          {Array.from({ length: Math.floor(height / 40) }, (_, i) => (
            <Path
              key={i}
              d={`M 0,${(i + 1) * 40} L ${width},${(i + 1) * 40}`}
              stroke="#ffffff06"
              strokeWidth={1}
            />
          ))}
          {completedPaths.map((d, i) => (
            <Path
              key={i}
              d={d}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          ))}
          {currentPath !== "" && (
            <Path
              d={currentPath}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
              opacity={0.85}
            />
          )}
        </Svg>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
  },
  toolbar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  toolBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    padding: 6,
  },
  toolLabel: {
    fontSize: 12,
    fontWeight: "500",
  },
  toolbarCenter: {
    flex: 1,
    alignItems: "center",
  },
  strokeCount: {
    fontSize: 12,
    fontStyle: "italic",
  },
  canvas: {
    flex: 1,
  },
});
