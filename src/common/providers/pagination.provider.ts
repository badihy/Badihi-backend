import { Injectable } from '@nestjs/common';
import { Model, QueryFilter, PopulateOptions, SortOrder } from 'mongoose';

export interface PaginationOptions<T = any> {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: SortOrder;
    search?: string;
    searchIn?: string[];
    relations?: (string | PopulateOptions)[];
    where?: QueryFilter<T>;
}

export interface PaginationMeta {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
}

export interface PaginatedResult<T> {
    data: T[];
    meta: PaginationMeta;
}

@Injectable()
export class PaginationProvider {
    async paginate<T>(
        model: Model<T>,
        options: PaginationOptions<T> = {}
    ): Promise<PaginatedResult<T>> {
        const {
            page = 1,
            limit = 10,
            sortBy,
            sortOrder = 'asc',
            search,
            searchIn: rawSearchIn = [],
            relations = [],
            where = {}
        } = options;

        // Normalize searchIn to always be an array
        const searchIn = Array.isArray(rawSearchIn) ? rawSearchIn : (rawSearchIn ? [rawSearchIn] : []);

        // Calculate offset
        const offset = (page >= 1 ? page - 1 : 0) * limit;

        // Build query
        const query: QueryFilter<T> = { ...where };

        // Add search functionality
        if (search && searchIn.length > 0) {
            const searchConditions = searchIn.map(field => ({
                [field]: { $regex: search, $options: 'i' } // Case-insensitive regex
            }));

            // If query already has $or, we need to combine them carefully
            // But typically 'where' + 'search' implies AND logic between them
            // The search itself is an OR between fields
            // So: (existing filters) AND (searchField1 OR searchField2 ...)
            if (Object.keys(query).length > 0) {
                // If there's already a query, we combine it with $and if necessary, 
                // or just add the $or condition if it doesn't conflict. 
                // Safest is to use $and if $or already exists in 'where'.
                if (query.$or) {
                    query.$and = [{ $or: query.$or as any }, { $or: searchConditions }];
                    delete query.$or;
                } else {
                    query.$or = searchConditions;
                }
            } else {
                query.$or = searchConditions;
            }
        }

        // Get total count
        const total = await model.countDocuments(query);

        // Build main query
        let mongoQuery = model.find(query);

        // Add relations (populate)
        if (relations.length > 0) {
            relations.forEach(relation => {
                mongoQuery = mongoQuery.populate(relation as any);
            });
        }

        // Add sorting
        if (sortBy) {
            const sortDirection: SortOrder = (String(sortOrder).toLowerCase() === 'desc' || sortOrder === -1) ? -1 : 1;
            mongoQuery = mongoQuery.sort({ [sortBy]: sortDirection });
        } else {
            // Default sort
            mongoQuery = mongoQuery.sort({ _id: -1 });
        }

        // Apply pagination
        mongoQuery = mongoQuery.skip(offset).limit(limit);

        // Execute query
        const data = await mongoQuery.exec();

        // Calculate pagination metadata
        const totalPages = Math.ceil(total / limit) || 1;
        const hasNextPage = page < totalPages;
        const hasPrevPage = page > 1;

        const meta: PaginationMeta = {
            total,
            page: Number(page),
            limit: Number(limit),
            totalPages,
            hasNextPage,
            hasPrevPage
        };

        return {
            data,
            meta
        };
    }

    // Helper method to create pagination options from query parameters
    createOptionsFromQuery(query: any): PaginationOptions {
        const options: PaginationOptions = {};

        if (query.page) {
            options.page = parseInt(query.page, 10);
        }

        if (query.limit) {
            options.limit = parseInt(query.limit, 10);
        }

        if (query.sortBy) {
            options.sortBy = query.sortBy;
        }

        if (query.sortOrder) {
            options.sortOrder = query.sortOrder;
        }

        if (query.search) {
            options.search = query.search;
        }

        if (query.searchIn) {
            options.searchIn = Array.isArray(query.searchIn) ? query.searchIn : [query.searchIn];
        }

        if (query.relations) {
            options.relations = Array.isArray(query.relations) ? query.relations : [query.relations];
        }

        return options;
    }
}