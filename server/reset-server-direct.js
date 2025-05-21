// Direct server reset script that doesn't rely on HTTP
// This script is meant to be required and called directly from the dev-tools.tsx file

/**
 * Reset all server data (rooms and connections)
 * @returns {Object} Result object with success status and message
 */
function resetServerData() {
  try {
    // Direct access to server data
    // Note: This assumes the script is running in the same Node.js process as the server
    // In practice, you would use this from a server-side command

    console.log('\n===== DIRECT SERVER RESET =====');

    // If global rooms and connections exist, clear them
    if (global.rooms && global.connections) {
      const roomCount = global.rooms.size;
      const connectionCount = global.connections.size;

      global.rooms.clear();
      global.connections.clear();

      console.log(
        `Cleared ${roomCount} rooms and ${connectionCount} connections`
      );
      console.log('===== SERVER RESET COMPLETE =====\n');

      return {
        success: true,
        message: `Server data reset. Cleared ${roomCount} rooms and ${connectionCount} connections.`,
      };
    } else {
      console.log('Server data not found or not accessible');
      console.log('===== SERVER RESET FAILED =====\n');

      return {
        success: false,
        message:
          'Server data not found or not accessible. Make sure server is running.',
      };
    }
  } catch (error) {
    console.error('Error during direct server reset:', error);
    return {
      success: false,
      message: `Error during server reset: ${error.message}`,
    };
  }
}

// For direct use as a script
if (require.main === module) {
  const result = resetServerData();
  console.log(result);
}

module.exports = { resetServerData };
