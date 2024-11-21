import React from 'react';
import Subnav from '../components/subnav'; // Ensure correct import path

const Developer = () => {
  return (
    <>
      <Subnav />
      <div className="col-lg-8 mx-auto p-4 py-md-5">
        <h1>Developer</h1>
        <p>API Documentation</p><br />

        <h4>Authentication</h4>
        <code>/login POST</code>
        <p>Parameters:</p>
        <ul>
          <li><strong>username</strong>: User's username</li>
          <li><strong>password</strong>: User's password</li>
        </ul>

        <code>/register POST</code>
        <p>Parameters:</p>
        <ul>
          <li><strong>username</strong>: Desired username</li>
          <li><strong>password</strong>: Desired password</li>
        </ul>

        <code>/validate-session GET</code>
        <p>Validates the user's session token.</p>

        <h4>Grid and Objects</h4>
        <code>/grid/objects GET</code>
        <p>Retrieve all objects in a radius around the player.</p>
        <ul>
          <li><strong>player_x</strong>: Player's current X coordinate</li>
          <li><strong>player_y</strong>: Player's current Y coordinate</li>
          <li><strong>radius</strong>: Radius of the area to query</li>
        </ul>

        <code>/grid/objects POST</code>
        <p>Create a new object on the grid.</p>
        <ul>
          <li><strong>type</strong>: Type of the object (e.g., "tree", "ATM")</li>
          <li><strong>grid_x</strong>: X coordinate of the object</li>
          <li><strong>grid_y</strong>: Y coordinate of the object</li>
          <li><strong>attributes</strong>: JSON of additional attributes</li>
        </ul>

        <code>/grid/objects/:id DELETE</code>
        <p>Delete an object from the grid by its ID.</p>

        <h4>Player Management</h4>
        <code>/player/:id GET</code>
        <p>Retrieve a player's details by their ID.</p>

        <code>/player/inventory GET</code>
        <p>Retrieve the player's inventory.</p>

        <code>/player/inventory POST</code>
        <p>Add an item to the player's inventory.</p>
        <ul>
          <li><strong>item_id</strong>: ID of the item</li>
          <li><strong>quantity</strong>: Number of items to add</li>
        </ul>

        <code>/player/move POST</code>
        <p>Update the player's position.</p>
        <ul>
          <li><strong>player_id</strong>: The ID of the player</li>
          <li><strong>new_x</strong>: New X coordinate</li>
          <li><strong>new_y</strong>: New Y coordinate</li>
        </ul>

        <h4>Social Features</h4>
        <code>/chat POST</code>
        <p>Send a chat message.</p>
        <ul>
          <li><strong>player_id</strong>: ID of the sender</li>
          <li><strong>message</strong>: Content of the chat message</li>
        </ul>

        <code>/friends GET</code>
        <p>Retrieve a list of friends for the player.</p>

        <code>/friends POST</code>
        <p>Add a friend by ID.</p>
        <ul>
          <li><strong>player_id</strong>: The ID of the player</li>
        </ul>

        <h4>Combat</h4>
        <code>/combat/attack POST</code>
        <p>Perform an attack on another player.</p>
        <ul>
          <li><strong>attacker_id</strong>: ID of the attacking player</li>
          <li><strong>target_id</strong>: ID of the target player</li>
          <li><strong>damage</strong>: Amount of damage dealt</li>
        </ul>

        <h4>Economy</h4>
        <code>/economy/withdraw POST</code>
        <p>Withdraw money from an ATM.</p>
        <ul>
          <li><strong>player_id</strong>: ID of the player</li>
          <li><strong>amount</strong>: Amount to withdraw</li>
        </ul>

        <code>/economy/deposit POST</code>
        <p>Deposit money into an ATM.</p>
        <ul>
          <li><strong>player_id</strong>: ID of the player</li>
          <li><strong>amount</strong>: Amount to deposit</li>
        </ul>

        <h4>Utility</h4>
        <code>/server/status GET</code>
        <p>Get the status of the game server.</p>

        <code>/leaderboard GET</code>
        <p>Retrieve the global leaderboard.</p>
      </div>
    </>
  );
};

export default Developer;
