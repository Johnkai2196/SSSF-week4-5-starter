import {GraphQLError} from 'graphql';
import {Cat} from '../../interfaces/Cat';
import {locationInput} from '../../interfaces/Location';
import {UserIdWithToken} from '../../interfaces/User';
import rectangleBounds from '../../utils/rectangleBounds';
import catModel from '../models/catModel';
import {Types} from 'mongoose';

// TODO: create resolvers based on cat.graphql
// note: when updating or deleting a cat, you need to check if the user is the owner of the cat
// note2: when updating or deleting a cat as admin, you need to check if the user is an admin by checking the role from the user object
export default {
  // 1. Queries
  Query: {
    // 1.1. Get all cats
    cats: async () => {
      return await catModel.find();
    },
    // 1.2. Get a cat by id
    catById: async (_parent: unknown, args: Cat) => {
      return await catModel.findById(args.id);
    },
    // 1.3. Get all cats by owner
    catsByOwner: async (_parent: unknown, args: UserIdWithToken) => {
      return await catModel.find({owner: args.id});
    },
    // 1.4. Get all cats by location
    catsByArea: async (_parent: unknown, args: locationInput) => {
      const bounds = rectangleBounds(args.topRight, args.bottomLeft);
      return await catModel.find({
        location: {
          $geoWithin: {
            $geometry: bounds,
          },
        },
      });
    },
  },
  // 2. Mutations
  Mutation: {
    // 2.1. Create a cat
    createCat: async (_parent: unknown, args: Cat, user: UserIdWithToken) => {
      if (!user.token) {
        throw new GraphQLError('Not authorized', {
          extensions: {code: 'NOT_AUTHORIZED'},
        });
      }
      args.owner = user.id as unknown as Types.ObjectId;
      const cat = new catModel(args);
      return await cat.save();
    },
    // 2.2. Update a cat
    updateCat: async (_parent: unknown, args: Cat, user: UserIdWithToken) => {
      if (!user.token) {
        throw new GraphQLError('Not authorized', {
          extensions: {code: 'NOT_AUTHORIZED'},
        });
      }

      return await catModel.findOneAndUpdate(
        {_id: args.id, owner: user.id},
        args,
        {new: true}
      );
    },
    // 2.3. Delete a cat
    deleteCat: async (_parent: unknown, args: Cat, user: UserIdWithToken) => {
      if (!user.token) {
        throw new GraphQLError('Not authorized', {
          extensions: {code: 'NOT_AUTHORIZED'},
        });
      }

      return await catModel.findOneAndDelete({_id: args.id, owner: user.id});
    },
    // 2.4. Update a cat as admin
    updateCatAsAdmin: async (
      _parent: unknown,
      args: Cat,
      user: UserIdWithToken
    ) => {
      if (!user.token || user.role !== 'admin') {
        throw new GraphQLError('Not authorized', {
          extensions: {code: 'NOT_AUTHORIZED'},
        });
      }
      return await catModel.findByIdAndUpdate(args.id, args, {new: true});
    },
    // 2.5. Delete a cat as admin
    deleteCatAsAdmin: async (
      _parent: unknown,
      args: Cat,
      user: UserIdWithToken
    ) => {
      if (!user.token || user.role !== 'admin') {
        throw new GraphQLError('Not authorized', {
          extensions: {code: 'NOT_AUTHORIZED'},
        });
      }
      return await catModel.findByIdAndDelete(args.id);
    },
  },
};
