import React, { useState, useRef, useEffect } from 'react';
import {
  ChevronLeftIcon,
  ArrowsPointingOutIcon,
  ArrowUturnLeftIcon,
  ArrowUturnRightIcon,
  SpeakerWaveIcon,
  SpeakerXMarkIcon,
  StopIcon,
  PlayIcon,
} from '@heroicons/react/24/solid';

type Stream = {
  id: number;
  title: string;
  url: string;
  thumbnail: string;
};

const VideoPlayer: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [volume, setVolume] = useState<number>(1);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [showControls, setShowControls] = useState<boolean>(true);
  const [showVolumeSlider, setShowVolumeSlider] = useState<boolean>(false);

  const [streams] = useState<Stream[]>([
    {
      id: 1,
      title: 'Big Buck Bunny',
      url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
      thumbnail:
        'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/BigBuckBunny.jpg',
    },
    {
      id: 2,
      title: 'Elephant Dream',
      url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
      thumbnail:
        'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/ElephantsDream.jpg',
    },
    {
      id: 3,
      title: 'For Bigger Blazes',
      url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
      thumbnail:
        'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/ForBiggerBlazes.jpg',
    },
  ]);

  const [currentStream, setCurrentStream] = useState<number>(0);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const updateTime = () => setCurrentTime(video.currentTime);
    const updateDuration = () => setDuration(video.duration);

    video.addEventListener('timeupdate', updateTime);
    video.addEventListener('loadedmetadata', updateDuration);

    return () => {
      video.removeEventListener('timeupdate', updateTime);
      video.removeEventListener('loadedmetadata', updateDuration);
    };
  }, []);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      video.play();
      setIsPlaying(true);
    } else {
      video.pause();
      setIsPlaying(false);
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!videoRef.current) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    const seekTime = percent * duration;

    videoRef.current.currentTime = seekTime;
    setCurrentTime(seekTime);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!videoRef.current) return;

    const vol = parseFloat(e.target.value);
    videoRef.current.volume = vol;
    setVolume(vol);
    setIsMuted(vol === 0);
  };

  const toggleMute = () => {
    if (!videoRef.current) return;

    if (isMuted) {
      videoRef.current.volume = volume || 0.5;
      setIsMuted(false);
    } else {
      videoRef.current.volume = 0;
      setIsMuted(true);
    }
  };

  const skip = (seconds: number) => {
    if (!videoRef.current) return;

    videoRef.current.currentTime = Math.max(
      0,
      Math.min(duration, currentTime + seconds)
    );
  };

  const toggleFullscreen = () => {
    containerRef.current?.requestFullscreen();
  };

  const changeStream = (index: number) => {
    if (!videoRef.current) return;

    const wasPlaying = !videoRef.current.paused;
    setCurrentStream(index);
    setCurrentTime(0);

    setTimeout(() => {
      if (wasPlaying) {
        videoRef.current?.play();
      }
    }, 100);
  };

  const formatTime = (time: number): string => {
    if (isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex w-full relative justify-center p-4 bg-b">
      <div className="w-full flex flex-row max-w-6xl rounded-sm">
        <div
          ref={containerRef}
          className="relative bg-black group rounded-[10px] overflow-hidden"
          onMouseEnter={() => setShowControls(true)}
          onMouseLeave={() => {
            setShowControls(false);
            setShowVolumeSlider(false);
          }}
        >
          <video
            ref={videoRef}
            src={streams[currentStream].url}
            className="w-full aspect-video"
            onClick={togglePlay}
          />

          <div
            className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent px-6 pb-4 pt-20 transition-opacity duration-300 ${
              showControls ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <div className="flex items-center justify-center gap-4">
              {/* Left */}
              <div className="flex items-center gap-3 flex-shrink-0">
                <button onClick={togglePlay} className="text-white">
                  {isPlaying ? (
                    <StopIcon className="w-6 h-6" />
                  ) : (
                    <PlayIcon className="w-6 h-6" />
                  )}
                </button>

                <button onClick={() => skip(-10)} className="text-white">
                  <ArrowUturnLeftIcon className="w-6 h-6" />
                </button>

                <button onClick={() => skip(10)} className="text-white">
                  <ArrowUturnRightIcon className="w-6 h-6" />
                </button>

                <button
                  onClick={toggleMute}
                  onMouseEnter={() => setShowVolumeSlider(true)}
                  className="text-white"
                >
                  {isMuted ? (
                    <SpeakerXMarkIcon className="w-6 h-6" />
                  ) : (
                    <SpeakerWaveIcon className="w-6 h-6" />
                  )}
                </button>

                <div className="text-white text-sm">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </div>
              </div>

              {/* Progress */}
              <div className="flex-1 h-6 flex items-center">
                <div
                  className="w-full h-1 bg-white/30 rounded-full cursor-pointer"
                  onClick={handleSeek}
                >
                  <div
                    className="h-full bg-gradient-to-r from-orange-500 to-yellow-500 rounded-full"
                    style={{ width: `${(currentTime / duration) * 100}%` }}
                  />
                </div>
              </div>

              {/* Right */}
              <button onClick={toggleFullscreen} className="text-white">
                <ArrowsPointingOutIcon className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoPlayer;
