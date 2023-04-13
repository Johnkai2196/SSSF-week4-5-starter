import {GraphQLError} from 'graphql';
import {Cat} from '../../interfaces/Cat';
import LoginMessageResponse from '../../interfaces/LoginMessageResponse';
import {User, UserIdWithToken} from '../../interfaces/User';
// TODO: create resolvers based on user.graphql
// note: when updating or deleting a user don't send id to the auth server, it will get it from the token
// note2: when updating or deleting a user as admin, you need to check if the user is an admin by checking the role from the user object
export default {
  Cat: {
    owner: async (parent: Cat) => {
      const response = await fetch(
        `${process.env.AUTH_URL}/users/${parent.owner}`
      );
      if (!response.ok) {
        throw new GraphQLError(response.statusText, {
          extensions: {
            code: 'NOT_FOUND',
          },
        });
      }
      const user = (await response.json()) as User;
      return user;
    },
  },
  // 1. Queries
  Query: {
    // 1.1. Get all users
    users: async () => {
      const response = await fetch(`${process.env.AUTH_URL}/users`);
      if (!response.ok) {
        throw new GraphQLError(response.statusText, {
          extensions: {
            code: 'NOT_FOUND',
          },
        });
      }
      const users = (await response.json()) as User[];
      return users;
    },
    // 1.2. Get a user by id
    userById: async (_parent: unknown, args: {id: string}) => {
      const response = await fetch(`${process.env.AUTH_URL}/users/${args.id}`);
      if (!response.ok) {
        throw new GraphQLError(response.statusText, {
          extensions: {
            code: 'NOT_FOUND',
          },
        });
      }
      const user = (await response.json()) as User;
      return user;
    },
    // 1.3. check token
    checkToken: async (
      _parent: unknown,
      _args: unknown,
      user: UserIdWithToken
    ) => {
      const response = await fetch(`${process.env.AUTH_URL}/users/token`, {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });
      if (!response.ok) {
        throw new GraphQLError(response.statusText, {
          extensions: {
            code: 'NOT_FOUND',
          },
        });
      }
      const userFromAuth = await response.json();
      return userFromAuth;
    },
  },
  // 2. Mutations
  Mutation: {
    // 2.1. Register a user
    register: async (_parent: unknown, args: {user: User}) => {
      console.log(args.user);

      const response = await fetch(`${process.env.AUTH_URL}/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(args.user),
      });
      if (!response.ok) {
        throw new GraphQLError(response.statusText, {
          extensions: {
            code: 'NOT_FOUND',
          },
        });
      }
      const user = (await response.json()) as LoginMessageResponse;
      return user;
    },
    // 2.2 Login a user
    login: async (
      _parent: unknown,
      args: {credentials: {username: string; password: string}}
    ) => {
      const response = await fetch(`${process.env.AUTH_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(args.credentials),
      });
      if (!response.ok) {
        throw new GraphQLError(response.statusText, {
          extensions: {
            code: 'NOT_FOUND',
          },
        });
      }
      const user = (await response.json()) as LoginMessageResponse;
      return user;
    },
    // 2.3. Update a user
    updateUser: async (
      _parent: unknown,
      args: {user: User},
      user: UserIdWithToken
    ) => {
      if (!user.token) {
        throw new GraphQLError('Unauthorized', {
          extensions: {
            code: 'UNAUTHORIZED',
          },
        });
      }
      const response = await fetch(`${process.env.AUTH_URL}/users/`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify(args.user),
      });
      if (!response.ok) {
        throw new GraphQLError(response.statusText, {
          extensions: {
            code: 'NOT_FOUND',
          },
        });
      }
      const userUpdated = (await response.json()) as LoginMessageResponse;
      return userUpdated;
    },
    // 2.4. Delete a user
    deleteUser: async (
      _parent: unknown,
      args: unknown,
      user: UserIdWithToken
    ) => {
      if (!user.token) {
        throw new GraphQLError('Unauthorized', {
          extensions: {
            code: 'UNAUTHORIZED',
          },
        });
      }
      const response = await fetch(`${process.env.AUTH_URL}/users`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify(args),
      });
      if (!response.ok) {
        throw new GraphQLError(response.statusText, {
          extensions: {
            code: 'NOT_FOUND',
          },
        });
      }
      const userDeleted = (await response.json()) as LoginMessageResponse;
      return userDeleted;
    },
  },
};
