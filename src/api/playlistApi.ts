import { SERVER_IP } from "../const.jsx";

// Define interfaces for the data structures
interface Playlist {
	id: string;
	name: string;
	description?: string;
	cover_image?: string;
	songs?: string[];
}

interface PlaylistData {
	name: string;
	description?: string;
	cover_image?: string;
	songs?: string[];
}

interface SongData {
	playlist_id: string;
	music_id: string;
	position?: number;
}

interface ApiResponse {
	message?: string;
	playlists?: Playlist[];
	[key: string]: any; // Allow additional properties
}

/**
 * Fetches playlists for a specific user.
 * @param {string} userId - The ID of the user whose playlists are being fetched.
 * @returns {Promise<Playlist[]>} - A list of playlists belonging to the user.
 * @throws {Error} - If the request fails or the response is not OK.
 */
export const fetchUserPlaylists = async (
	userId: string,
): Promise<Playlist[]> => {
	try {
		const response = await fetch(
			`${SERVER_IP}/playlist/get_users_playlists?user_uuid=${encodeURIComponent(
				userId,
			)}`,
			{
				method: "GET",
				headers: {
					"Content-Type": "application/json",
				},
			},
		);

		const result: ApiResponse = await response.json();

		if (response.status !== 200) {
			throw new Error(result.message || "Failed to fetch playlists");
		}

		console.log("Playlists fetched successfully:", result.playlists);
		return result.playlists || [];
	} catch (error) {
		throw error;
	}
};

/**
 * Creates a new playlist.
 * @param {PlaylistData} playlistData - The data for the new playlist.
 * @returns {Promise<ApiResponse>} - The response from the server, including the created playlist's details.
 * @throws {Error} - If the request fails or the response is not OK.
 */
export const createPlaylist = async (
	playlistData: PlaylistData,
): Promise<ApiResponse> => {
	try {
		const response = await fetch(`${SERVER_IP}/playlist/new`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify(playlistData),
		});

		const result: ApiResponse = await response.json();

		if (response.status !== 201) {
			throw new Error(result.message || "Failed to create playlist");
		}

		console.log("Playlist created successfully:", result.message);
		return result;
	} catch (error) {
		throw error;
	}
};

/**
 * Fetches a playlist by its ID.
 * @param {string} playlistId - The ID of the playlist to fetch.
 * @returns {Promise<Playlist>} - The playlist data, including metadata and songs.
 * @throws {Error} - If the request fails or the response is not OK.
 */
export const fetchPlaylistById = async (
	playlistId: string,
): Promise<Playlist> => {
	try {
		const response = await fetch(
			`${SERVER_IP}/playlist/get_by_uuid?playlist_id=${playlistId}`,
			{
				method: "GET",
				headers: {
					"Content-Type": "application/json",
				},
			},
		);

		if (!response.ok) {
			throw new Error("Failed to fetch playlist data");
		}

		const result: Playlist = await response.json();
		console.log("Playlist Data:", JSON.stringify(result, null, 4));
		return result;
	} catch (error) {
		throw error;
	}
};

/**
 * Adds a song to a playlist.
 * @param {SongData} songData - The data for adding a song to a playlist.
 * @returns {Promise<ApiResponse>} - The response from the server, including a success message or error details.
 * @throws {Error} - If the request fails or the response is not OK.
 */
export const addSongToPlaylist = async (
	songData: SongData,
): Promise<ApiResponse> => {
	try {
		const response = await fetch(`${SERVER_IP}/playlist/add_song`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify(songData),
		});

		const result: ApiResponse = await response.json();

		if (response.status !== 201) {
			throw new Error(result.message || "Failed to add song to playlist");
		}

		console.log("Song added to playlist successfully:", result.message);
		return result;
	} catch (error) {
		throw error;
	}
};
