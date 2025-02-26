// Node modules
import React, { useRef, useState, useEffect, useCallback } from "react";

// Local
import { useAppState } from "@/AppState.jsx";
import { SERVER_IP, MPState, fetchMusicUrl } from "@/const.jsx";
import { wsSend, OpCode } from "api/socketApi.ts";

// Assets
import previousButton from "/controlbar/PreviousButton.svg";
import playButton from "/controlbar/ButtonPlay.svg";
import pauseButton from "/controlbar/ButtonPause.svg";
import NextButton from "/controlbar/ButtonNext.svg";
import VolumeLow from "/volumecontrols/Volume Level Low.png";
import Mute from "/volumecontrols/Volume Mute.png";
import VolumeHigh from "/volumecontrols/Volume Level High.png";
import placeholder_logo from "/covers/cover.jpg";
import "./MusicPlayer.css";
import { fetchIsSongLiked, toggleSongLiked } from "@/api/likedSongsApi";

function MusicPlayer() {
	const {
		ws,
		appState,
		musicState,
		audioRef,
		controlsDisabled,
		addMsgHandler,
		updateMusicState,
	} = useAppState();

	const [initialVolume, setInitialVolume] = useState(musicState.volume);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState("");
	const [isSongLiked, setIsSongLiked] = useState(false); // State for song liked toggle

	const formatTime = (time) => {
		const minutes = Math.floor(time / 60);
		const seconds = Math.floor(time % 60);
		return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
	};

	// Responsible to set the music state of the lobby as a host
	useEffect(() => {
		if (!appState.in_lobby) return;
		if (!musicState.has_item) return;

		const payload = {
			op_code: OpCode.SET_MUSIC_STATE,
			value: {
				lobby_id: appState.lobby_id,
				user_id: appState.user_id,
				music_id: musicState.id,
				title: musicState.title,
				artist: musicState.artist,
				cover_img: musicState.cover_img,
				timestamp: musicState.timestamp,
				state: musicState.state,
			},
		};
		wsSend(ws, payload);
	}, [musicState.state]);
	
    useEffect(() => {
		fetchLikedState();
    }, [appState.user_id, musicState.id]);
	
	// Fetch the liked state of the song when the component mounts or when the song changes
	const fetchLikedState = async () => {
		if (appState.user_id && musicState.id) {
			try {
				const isLiked = await fetchIsSongLiked(appState.user_id, musicState.id);
				setIsSongLiked(isLiked);
			} catch (err) {
				console.error("Failed to fetch song liked state:", err);
			}
		}
	};
    // Handle toggling the liked state of the song
    const handleSongLikedToggle = async () => {
        const newLikedState = !isSongLiked;
        setIsSongLiked(newLikedState);

        try {
            const result = await toggleSongLiked(appState.user_id, musicState.id);
            console.log("Song liked state updated successfully:", result);
        } catch (err) {
            console.error("Failed to update song liked state:", err);
            setIsSongLiked(!newLikedState); // Revert the local state on error
        }
    };

	const handlePlayMusic = async () => {
		try {
			if (!musicState.has_item) {
				throw new Error("No song selected");
			}

			if (musicState.state == MPState.PLAY) {
				updateMusicState({ state: MPState.PAUSE });
			} else if (musicState.state == MPState.PAUSE) {
				updateMusicState({ state: MPState.PLAY });

				setIsLoading(true);
				setError("");
			}
		} catch (err) {
			console.error("Failed to load/play music:", err);
			setError("Failed to load music: " + err.message);
			updateMusicState({ state: MPState.PAUSE });
		} finally {
			setIsLoading(false);
		}
	};

	const onVolumeChange = (e) => {
		updateMusicState({
			state: MPState.CHANGE_VOLUME,
			state_data: e.target.value,
		});
	};

	const volumeToggle = () => {
		if (musicState.volume > 0) {
			setInitialVolume(musicState.volume); // Save the current volume before muting
			updateMusicState({
				state: MPState.CHANGE_VOLUME,
				state_data: 0,
			});
		} else {
			updateMusicState({
				state: MPState.CHANGE_VOLUME,
				state_data: initialVolume,
			});
		}
	};

	const handleSeekEnd = (e) => {
		const seekTime = (e.target.value / 100) * musicState.duration;
		updateMusicState({
			state: MPState.CHANGE_TIME,
			state_data: seekTime,
		});
	};

	const handleSeekMove = (e) => {
		const seekTime = (e.target.value / 100) * musicState.duration;
		updateMusicState({
			state: MPState.CHANGE_TIME,
			state_data: seekTime,
		});
	};

	return (
		<div className="music-player">
			<div>
				<img
					src={
						musicState.has_item
							? `${SERVER_IP}/image/${musicState.id}.png`
							: placeholder_logo
					}
					alt="Album cover"
					className="cover-image"
				/>
			</div>
			<div className="song-info">
				<div className="song-name">
					{musicState.has_item ? musicState.title : "No Song Selected"}
				</div>
				<div className="artist-name">
					{musicState.has_item ? musicState.artist : ""}
				</div>
			</div>

			{/* Song Liked Toggle Section */}
			{/* TODO : make a better checkbox */}
			<div className="song-liked-section">
				<label className="switch">
					<input
						type="checkbox"
						checked={isSongLiked}
						onChange={handleSongLikedToggle}
						disabled={isLoading}
					/>
					<span className="slider round"></span>
				</label>
				<span className="song-liked-label">Song Liked</span>
			</div>

			<div className="control-container">
				<div className="control-bar">
					<button
						className="control-button"
						disabled={isLoading || controlsDisabled}
					>
						<img
							src={previousButton}
							alt="Previous"
							className={`button-group ${controlsDisabled ? "disabled" : ""}`}
						/>
					</button>
					<button
						className="control-button"
						onClick={handlePlayMusic}
						disabled={isLoading || controlsDisabled}
					>
						<img
							src={musicState.state === MPState.PLAY ? pauseButton : playButton}
							alt={musicState.state === MPState.PLAY ? "Pause" : "Play"}
							className={`button-group ${controlsDisabled ? "disabled" : ""}`}
						/>
					</button>
					<button
						className="control-button"
						disabled={isLoading || controlsDisabled}
					>
						<img
							src={NextButton}
							alt="Next"
							className={`button-group ${controlsDisabled ? "disabled" : ""}`}
						/>
					</button>
				</div>
				<div className="status">
					<div className="music-status">{formatTime(musicState.timestamp)}</div>
					<input
						type="range"
						min="0"
						max="100"
						value={(musicState.timestamp / musicState.duration) * 100 || 0}
						onChange={handleSeekMove}
						onMouseUp={handleSeekEnd}
						onTouchEnd={handleSeekEnd}
						className="status-bar"
						disabled={isLoading || controlsDisabled}
					/>
				</div>
			</div>

			<div className="volume-status">
				<button
					className="volume-button"
					onClick={volumeToggle}
					disabled={isLoading}
				>
					<img
						className="volume-image"
						src={
							musicState.volume == 0
								? Mute
								: musicState.volume > 40
									? VolumeHigh
									: VolumeLow
						}
						alt="Volume"
					/>
				</button>
				<input
					type="range"
					min="0"
					max="100"
					value={musicState.volume}
					onChange={onVolumeChange}
					className="volume-control-bar"
					disabled={isLoading}
				/>
			</div>
		</div>
	);
}

export default MusicPlayer;
