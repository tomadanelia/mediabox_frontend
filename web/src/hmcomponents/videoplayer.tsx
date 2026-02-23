import React, { useState, useRef, useEffect } from 'react';
import Hls from 'hls.js';
import BadgeLiveDemo from '@/components/shadcn-studio/badge/cusotm/badge-c01';
import {
  ArrowsPointingOutIcon,
  SpeakerWaveIcon,
  SpeakerXMarkIcon,
} from '@heroicons/react/24/solid';
import { Play, Pause, SkipBack, SkipForward, RotateCcw, RotateCw, ScreenShare, PictureInPicture2, Share, Forward } from 'lucide-react';
import ChannelsPanelDemo from './FullScreenList';
import { sampleChannels } from './FullScreenList';

// Define API URL from environment variable or fallback
const API_URL = import.meta.env.VITE_API_URL || 'http://159.89.20.100';

type Stream = {
  id: string
  uuid:string;
  name: string;
  url: string;
  logo:String;
};

type VideoPlayerProps = {
  stream: Stream;
};

const VideoPlayer: React.FC<VideoPlayerProps> = ({ stream }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const hlsRef = useRef<Hls | null>(null);

  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [volume, setVolume] = useState<number>(1);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [showControls, setShowControls] = useState<boolean>(true);
  const [showVolumeSlider, setShowVolumeSlider] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [showChannels, setShowChannels] = useState<boolean>(false);
  const [currentStream, setCurrentStream] = useState<number>(0);
  const [videoUrl, setVideoUrl] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  // Fetch the actual stream URL when stream changes
  useEffect(() => {
    console.log('Stream changed:', stream);
    
    const fetchStreamUrl = async () => {
      setLoading(true);
      try {
        // Updated to use API_URL variable
        const response = await fetch(`${API_URL}/api/channels/${stream.id}/stream`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const result = await response.json();
        console.log('Fetched stream data:', result);
        setVideoUrl(result.url || result);
      } catch (err: any) {
        console.error('Error fetching stream:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStreamUrl();
  }, [stream.id]);

  // Initialize HLS player when videoUrl changes
  useEffect(() => {
    if (!videoUrl || !videoRef.current) return;

    const video = videoRef.current;

    // Clean up previous HLS instance
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    // Check if HLS is supported
    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
      });
      
      hlsRef.current = hls;
      hls.loadSource(videoUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        console.log('HLS manifest loaded, ready to play');
      });

      hls.on(Hls.Events.ERROR, (event, data) => {
        console.error('HLS error:', data);
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              console.error('Fatal network error, trying to recover');
              hls.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              console.error('Fatal media error, trying to recover');
              hls.recoverMediaError();
              break;
            default:
              console.error('Fatal error, cannot recover');
              hls.destroy();
              break;
          }
        }
      });
    } 
    // For Safari/iOS which has native HLS support
    else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = videoUrl;
      console.log('Using native HLS support (Safari/iOS)');
    }

    // Cleanup on unmount
    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [videoUrl]);

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

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
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
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
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
    <div className="flex w-full relative justify-center p-4 ">
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
            className=" aspect-video"
            onClick={togglePlay}
          />

          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
              <div className="text-white">Loading stream...</div>
            </div>
          )}

          {/* Channels Button - Top Right Corner in Fullscreen */}
          {isFullscreen && (
            <button 
              onClick={() => setShowChannels(!showChannels)} 
              className={`absolute top-6 right-6 z-50 text-white hover:text-orange-400 transition-all cursor-pointer px-4 py-2 bg-black/60 backdrop-blur-sm rounded-lg border border-white/20 ${showControls ? 'opacity-100' : 'opacity-0'}`}
            >
              Channels
            </button>
          )}

          {/* Channels Panel - Only in Fullscreen */}
          {isFullscreen && showChannels && (
            <ChannelsPanelDemo 
              onClose={() => setShowChannels(false)}
              channels={sampleChannels}
            />
          )}

          {/* Centered Control Buttons */}
          <div
            className={`absolute bottom-0 left-0 right-0 h-full flex justify-center items-center bg-gradient-to-t from-black/90 via-black/50 to-transparent px-6 pb-4 pt-20 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}
          >
            <div
              className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent px-6 pb-4 pt-20 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}
            >
              <div className="flex items-center justify-center gap-4">
                {/* Left */}
                <div className="flex items-center gap-3 flex-shrink-0">
                  <div
                    className='relative w-6 h-6'
                    onMouseEnter={() => setShowVolumeSlider(true)}
                    onMouseLeave={() => setShowVolumeSlider(false)}
                  >
                    <button
                      onClick={toggleMute}
                      className="text-white w-6 h-6"
                    >
                      {isMuted ? (
                        <SpeakerXMarkIcon className="w-6 h-6 cursor-pointer" />
                      ) : (
                        <SpeakerWaveIcon className="w-6 h-6 cursor-pointer" />
                      )}
                    </button>

                    {showVolumeSlider && (
                      <>
                        <div className='absolute bottom-6 left-1/2 -translate-x-1/2 w-8 h-6' />
                        
                        <div className='absolute bottom-10 left-1/2 -translate-x-1/2'>
                          <div className='h-40 w-6 rounded-sm bg-gray-400/20 backdrop-blur-sm p-1 flex items-center justify-center'>
                            <div 
                              className="absolute w-2 bottom-4 bg-gradient-to-r from-orange-500 to-yellow-500 rounded-full"
                              style={{ height: `${(isMuted ? 0 : volume) * 80}%` }}
                            />
                            <input
                              type="range"
                              min="0"
                              max="1"
                              step="0.01"
                              value={isMuted ? 0 : volume}
                              onChange={handleVolumeChange}
                              className="w-36 h-2 absolute appearance-none rounded-full cursor-pointer border-none outline-none -rotate-90"
                            />
                          </div>
                        </div>
                      </>
                    )}
                  </div>
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
                <div className="flex items-center gap-3 flex-shrink-0">
                  <button onClick={() => skip(-10)} className="text-white cursor-pointer">
                    <Forward className="w-6 h-6" />
                  </button>

                  <button onClick={() => skip(10)} className="text-white cursor-pointer">
                    <PictureInPicture2 className="w-6 h-6" />
                  </button>

                  <button
                    onClick={toggleMute}
                    onMouseEnter={() => setShowVolumeSlider(true)}
                    className="text-white"
                  >
                    <ScreenShare className="w-6 h-6 cursor-pointer" />
                  </button>
                  <button onClick={toggleFullscreen} className="text-white relative cursor-pointer">
                    <ArrowsPointingOutIcon className="w-6 h-6" />
                  </button>
                  <button className='absolute bottom-12 right-6'>
                    <BadgeLiveDemo/>
                  </button>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-center gap-6">
              <button
                className="text-white hover:text-orange-400 transition-colors"
                title="Previous video"
              >
                <SkipBack className="w-8 h-8" />
              </button>

              <button
                onClick={() => skip(-10)}
                className="text-white hover:text-orange-400 transition-colors"
                title="Skip back 10s"
              >
                <RotateCcw className="w-7 h-7" />
              </button>

              <button
                onClick={togglePlay}
                className="text-white hover:text-orange-400 transition-colors"
                title={isPlaying ? "Pause" : "Play"}
              >
                {isPlaying ? (
                  <Pause className="w-10 h-10" />
                ) : (
                  <Play className="w-10 h-10" />
                )}
              </button>

              <button
                onClick={() => skip(10)}
                className="text-white hover:text-orange-400 transition-colors"
                title="Skip forward 10s"
              >
                <RotateCw className="w-7 h-7" />
              </button>

              <button
                className="text-white hover:text-orange-400 transition-colors"
                title="Next video"
              >
                <SkipForward className="w-8 h-8" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoPlayer;