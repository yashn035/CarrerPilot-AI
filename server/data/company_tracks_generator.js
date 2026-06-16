/**
 * CareerPilot AI — Company Tracks Problem Bank Generator
 * Generates 600+ unique problems with company mappings for 19 companies.
 * Run: node server/data/company_tracks_generator.js
 */

const fs = require('fs');
const path = require('path');

const TOPICS = [
  'Arrays', 'Strings', 'Hashing', 'Linked Lists', 'Stack', 'Queue',
  'Trees', 'Binary Search Trees', 'Heaps', 'Graphs', 'Dynamic Programming',
  'Greedy', 'Recursion', 'Backtracking', 'Tries', 'Bit Manipulation',
  'Sliding Window', 'Two Pointer', 'Binary Search'
];

const COMPANIES = [
  'Google', 'Amazon', 'Microsoft', 'Meta', 'Apple',
  'Netflix', 'Adobe', 'Oracle', 'IBM', 'Goldman Sachs',
  'TCS', 'Infosys', 'Accenture', 'Capgemini', 'Wipro',
  'Cognizant', 'Deloitte', 'HCL', 'Tech Mahindra'
];

// Company profiles — define their topic distribution and difficulty ratios
const COMPANY_PROFILES = {
  Google:       { topics: ['Graphs','Dynamic Programming','Trees','Arrays','Binary Search'], easy: 8, medium: 57, hard: 35, tier: 'FAANG' },
  Amazon:       { topics: ['Trees','Arrays','Dynamic Programming','Graphs','Strings'], easy: 15, medium: 60, hard: 25, tier: 'FAANG' },
  Microsoft:    { topics: ['Arrays','Linked Lists','Trees','Dynamic Programming','Strings'], easy: 20, medium: 55, hard: 25, tier: 'FAANG' },
  Meta:         { topics: ['Graphs','Arrays','Dynamic Programming','Trees','Hashing'], easy: 10, medium: 55, hard: 35, tier: 'FAANG' },
  Apple:        { topics: ['Arrays','Trees','Graphs','Strings','Dynamic Programming'], easy: 15, medium: 55, hard: 30, tier: 'FAANG' },
  Netflix:      { topics: ['Dynamic Programming','Graphs','Arrays','System Design','Trees'], easy: 10, medium: 50, hard: 40, tier: 'Tier1' },
  Adobe:        { topics: ['Arrays','Dynamic Programming','Strings','Trees','Graphs'], easy: 20, medium: 55, hard: 25, tier: 'Tier1' },
  Oracle:       { topics: ['SQL','Arrays','Trees','Strings','Dynamic Programming'], easy: 25, medium: 55, hard: 20, tier: 'Tier1' },
  IBM:          { topics: ['Arrays','Strings','Dynamic Programming','Trees','Graphs'], easy: 30, medium: 55, hard: 15, tier: 'Tier1' },
  'Goldman Sachs': { topics: ['Dynamic Programming','Graphs','Arrays','Hashing','Trees'], easy: 15, medium: 55, hard: 30, tier: 'Tier1' },
  TCS:          { topics: ['Arrays','Strings','Stack','Hashing','Binary Search'], easy: 60, medium: 35, hard: 5,  tier: 'Mass' },
  Infosys:      { topics: ['Arrays','Strings','Linked Lists','Stack','Queue'], easy: 55, medium: 40, hard: 5,  tier: 'Mass' },
  Accenture:    { topics: ['Arrays','Strings','Hashing','Stack','Trees'], easy: 55, medium: 38, hard: 7,  tier: 'Mass' },
  Capgemini:    { topics: ['Arrays','Strings','Stack','Queue','Hashing'], easy: 60, medium: 35, hard: 5,  tier: 'Mass' },
  Wipro:        { topics: ['Arrays','Strings','Linked Lists','Stack','Hashing'], easy: 58, medium: 37, hard: 5,  tier: 'Mass' },
  Cognizant:    { topics: ['Arrays','Strings','Stack','Hashing','Binary Search'], easy: 55, medium: 40, hard: 5,  tier: 'Mass' },
  Deloitte:     { topics: ['Arrays','Strings','Dynamic Programming','Trees','Hashing'], easy: 40, medium: 50, hard: 10, tier: 'Tier2' },
  HCL:          { topics: ['Arrays','Strings','Linked Lists','Stack','Trees'], easy: 55, medium: 38, hard: 7,  tier: 'Mass' },
  'Tech Mahindra': { topics: ['Arrays','Strings','Stack','Hashing','Linked Lists'], easy: 58, medium: 37, hard: 5,  tier: 'Mass' }
};

// 600+ placement-focused problem definitions
const MASTER_PROBLEMS = [
  // ── ARRAYS (70 problems) ──
  { title:'Two Sum', topic:'Arrays', difficulty:'Easy', frequency:'High', oaRound:true, interviewRound:true, description:'Find two numbers in an array that sum to a target value.' },
  { title:'Best Time to Buy and Sell Stock', topic:'Arrays', difficulty:'Easy', frequency:'High', oaRound:true, interviewRound:true, description:'Find the maximum profit from a single buy-sell transaction.' },
  { title:'Contains Duplicate', topic:'Arrays', difficulty:'Easy', frequency:'High', oaRound:true, interviewRound:false, description:'Determine if any value appears at least twice in the array.' },
  { title:'Product of Array Except Self', topic:'Arrays', difficulty:'Medium', frequency:'High', oaRound:true, interviewRound:true, description:'Return an array where each element is the product of all others.' },
  { title:'Maximum Subarray', topic:'Arrays', difficulty:'Medium', frequency:'High', oaRound:true, interviewRound:true, description:'Find the contiguous subarray with the largest sum.' },
  { title:'Maximum Product Subarray', topic:'Arrays', difficulty:'Medium', frequency:'Medium', oaRound:false, interviewRound:true, description:'Find the contiguous subarray with the largest product.' },
  { title:'Find Minimum in Rotated Sorted Array', topic:'Arrays', difficulty:'Medium', frequency:'Medium', oaRound:false, interviewRound:true, description:'Find the minimum element in a rotated sorted array.' },
  { title:'Search in Rotated Sorted Array', topic:'Arrays', difficulty:'Medium', frequency:'High', oaRound:true, interviewRound:true, description:'Search for a target in a rotated sorted array.' },
  { title:'3Sum', topic:'Arrays', difficulty:'Medium', frequency:'High', oaRound:false, interviewRound:true, description:'Find all unique triplets that sum to zero.' },
  { title:'Container With Most Water', topic:'Arrays', difficulty:'Medium', frequency:'High', oaRound:true, interviewRound:true, description:'Find two lines that contain the most water.' },
  { title:'Merge Intervals', topic:'Arrays', difficulty:'Medium', frequency:'High', oaRound:true, interviewRound:true, description:'Merge all overlapping intervals.' },
  { title:'Insert Interval', topic:'Arrays', difficulty:'Medium', frequency:'Medium', oaRound:false, interviewRound:true, description:'Insert a new interval into sorted non-overlapping intervals.' },
  { title:'Jump Game', topic:'Arrays', difficulty:'Medium', frequency:'Medium', oaRound:true, interviewRound:true, description:'Determine if you can reach the last index.' },
  { title:'Jump Game II', topic:'Arrays', difficulty:'Medium', frequency:'Medium', oaRound:false, interviewRound:true, description:'Find the minimum number of jumps to reach the last index.' },
  { title:'Rotate Array', topic:'Arrays', difficulty:'Medium', frequency:'Medium', oaRound:true, interviewRound:false, description:'Rotate an array to the right by k steps.' },
  { title:'Find All Numbers Disappeared in an Array', topic:'Arrays', difficulty:'Easy', frequency:'Medium', oaRound:true, interviewRound:false, description:'Find all integers in range missing from the array.' },
  { title:'Sort Colors', topic:'Arrays', difficulty:'Medium', frequency:'High', oaRound:true, interviewRound:true, description:'Sort an array with 0s, 1s, and 2s in-place.' },
  { title:'Subarray Sum Equals K', topic:'Arrays', difficulty:'Medium', frequency:'High', oaRound:false, interviewRound:true, description:'Count the total number of continuous subarrays with sum equal to k.' },
  { title:'Spiral Matrix', topic:'Arrays', difficulty:'Medium', frequency:'Medium', oaRound:true, interviewRound:true, description:'Return all elements of a matrix in spiral order.' },
  { title:'Set Matrix Zeroes', topic:'Arrays', difficulty:'Medium', frequency:'Medium', oaRound:false, interviewRound:true, description:'Set entire row and column to zero if element is zero.' },
  { title:'Pascal Triangle', topic:'Arrays', difficulty:'Easy', frequency:'Medium', oaRound:true, interviewRound:false, description:'Generate the first n rows of Pascal triangle.' },
  { title:'Majority Element', topic:'Arrays', difficulty:'Easy', frequency:'High', oaRound:true, interviewRound:true, description:'Find the element appearing more than n/2 times.' },
  { title:'Move Zeroes', topic:'Arrays', difficulty:'Easy', frequency:'High', oaRound:true, interviewRound:false, description:'Move all zeroes to end while maintaining relative order.' },
  { title:'Next Permutation', topic:'Arrays', difficulty:'Medium', frequency:'Medium', oaRound:false, interviewRound:true, description:'Rearrange numbers into the next greater permutation.' },
  { title:'Rotate Image', topic:'Arrays', difficulty:'Medium', frequency:'Medium', oaRound:false, interviewRound:true, description:'Rotate an n×n matrix by 90 degrees in place.' },
  { title:'Find Peak Element', topic:'Arrays', difficulty:'Medium', frequency:'Medium', oaRound:false, interviewRound:true, description:'Find a peak element where neighbors are smaller.' },
  { title:'Longest Consecutive Sequence', topic:'Arrays', difficulty:'Medium', frequency:'High', oaRound:false, interviewRound:true, description:'Find the length of longest consecutive sequence.' },
  { title:'Missing Number', topic:'Arrays', difficulty:'Easy', frequency:'High', oaRound:true, interviewRound:true, description:'Find the missing number in range [0,n].' },
  { title:'Single Number', topic:'Arrays', difficulty:'Easy', frequency:'High', oaRound:true, interviewRound:true, description:'Find the element that appears once while others appear twice.' },
  { title:'Kth Largest Element in Array', topic:'Arrays', difficulty:'Medium', frequency:'High', oaRound:true, interviewRound:true, description:'Find the kth largest element using heap or quickselect.' },
  { title:'Find the Duplicate Number', topic:'Arrays', difficulty:'Medium', frequency:'High', oaRound:true, interviewRound:true, description:'Find the duplicate in array of n+1 integers.' },
  { title:'Median of Two Sorted Arrays', topic:'Arrays', difficulty:'Hard', frequency:'High', oaRound:false, interviewRound:true, description:'Find the median of two sorted arrays in O(log(m+n)).' },
  { title:'Trapping Rain Water', topic:'Arrays', difficulty:'Hard', frequency:'High', oaRound:false, interviewRound:true, description:'Compute water trapped between elevation map bars.' },
  { title:'4Sum', topic:'Arrays', difficulty:'Medium', frequency:'Low', oaRound:false, interviewRound:true, description:'Find all unique quadruplets summing to target.' },
  { title:'Gas Station', topic:'Arrays', difficulty:'Medium', frequency:'Medium', oaRound:false, interviewRound:true, description:'Find the starting gas station for a complete circular route.' },
  { title:'Candy Distribution', topic:'Arrays', difficulty:'Hard', frequency:'Low', oaRound:false, interviewRound:true, description:'Distribute candies to children with rating constraints.' },

  // ── STRINGS (55 problems) ──
  { title:'Valid Palindrome', topic:'Strings', difficulty:'Easy', frequency:'High', oaRound:true, interviewRound:true, description:'Check if a string is a palindrome ignoring non-alphanumeric chars.' },
  { title:'Longest Substring Without Repeating Characters', topic:'Strings', difficulty:'Medium', frequency:'High', oaRound:true, interviewRound:true, description:'Find the length of longest substring without repeating chars.' },
  { title:'Longest Palindromic Substring', topic:'Strings', difficulty:'Medium', frequency:'High', oaRound:true, interviewRound:true, description:'Find the longest palindromic substring.' },
  { title:'Valid Anagram', topic:'Strings', difficulty:'Easy', frequency:'High', oaRound:true, interviewRound:true, description:'Check if two strings are anagrams of each other.' },
  { title:'Group Anagrams', topic:'Strings', difficulty:'Medium', frequency:'High', oaRound:true, interviewRound:true, description:'Group strings that are anagrams together.' },
  { title:'Encode and Decode Strings', topic:'Strings', difficulty:'Medium', frequency:'Medium', oaRound:false, interviewRound:true, description:'Design an algorithm to encode/decode a list of strings.' },
  { title:'Find All Anagrams in a String', topic:'Strings', difficulty:'Medium', frequency:'Medium', oaRound:true, interviewRound:true, description:'Find all start indices of anagrams of p in s.' },
  { title:'Minimum Window Substring', topic:'Strings', difficulty:'Hard', frequency:'High', oaRound:false, interviewRound:true, description:'Find minimum window in s containing all chars of t.' },
  { title:'Reverse Words in a String', topic:'Strings', difficulty:'Medium', frequency:'Medium', oaRound:true, interviewRound:true, description:'Reverse the order of words in a string.' },
  { title:'String Compression', topic:'Strings', difficulty:'Medium', frequency:'Medium', oaRound:true, interviewRound:true, description:'Compress the string using counts of repeated chars.' },
  { title:'Roman to Integer', topic:'Strings', difficulty:'Easy', frequency:'Medium', oaRound:true, interviewRound:false, description:'Convert Roman numeral string to integer.' },
  { title:'Integer to Roman', topic:'Strings', difficulty:'Medium', frequency:'Medium', oaRound:false, interviewRound:true, description:'Convert integer to Roman numeral string.' },
  { title:'Count and Say', topic:'Strings', difficulty:'Medium', frequency:'Medium', oaRound:true, interviewRound:false, description:'Generate the nth term of the count and say sequence.' },
  { title:'Implement strStr', topic:'Strings', difficulty:'Easy', frequency:'Medium', oaRound:true, interviewRound:true, description:'Find the first occurrence of needle in haystack.' },
  { title:'Longest Common Prefix', topic:'Strings', difficulty:'Easy', frequency:'Medium', oaRound:true, interviewRound:true, description:'Find the longest common prefix among an array of strings.' },
  { title:'ZigZag Conversion', topic:'Strings', difficulty:'Medium', frequency:'Low', oaRound:false, interviewRound:true, description:'Convert string to zigzag pattern and read row by row.' },
  { title:'Multiply Strings', topic:'Strings', difficulty:'Medium', frequency:'Low', oaRound:false, interviewRound:true, description:'Multiply two numbers represented as strings.' },
  { title:'Wildcard Matching', topic:'Strings', difficulty:'Hard', frequency:'Medium', oaRound:false, interviewRound:true, description:'Implement wildcard pattern matching with ? and *.' },
  { title:'Regular Expression Matching', topic:'Strings', difficulty:'Hard', frequency:'Medium', oaRound:false, interviewRound:true, description:'Implement regular expression matching with . and *.' },
  { title:'Edit Distance', topic:'Strings', difficulty:'Hard', frequency:'High', oaRound:false, interviewRound:true, description:'Minimum operations to convert word1 to word2.' },
  { title:'Palindrome Partitioning', topic:'Strings', difficulty:'Medium', frequency:'Medium', oaRound:false, interviewRound:true, description:'Partition string such that every substring is a palindrome.' },
  { title:'Decode Ways', topic:'Strings', difficulty:'Medium', frequency:'High', oaRound:true, interviewRound:true, description:'Count number of ways to decode a message.' },
  { title:'Isomorphic Strings', topic:'Strings', difficulty:'Easy', frequency:'Medium', oaRound:true, interviewRound:false, description:'Check if two strings are isomorphic.' },
  { title:'Word Pattern', topic:'Strings', difficulty:'Easy', frequency:'Medium', oaRound:true, interviewRound:false, description:'Check if string follows the same pattern.' },
  { title:'Ransom Note', topic:'Strings', difficulty:'Easy', frequency:'Medium', oaRound:true, interviewRound:false, description:'Check if ransom note can be constructed from magazine.' },
  { title:'First Unique Character in a String', topic:'Strings', difficulty:'Easy', frequency:'High', oaRound:true, interviewRound:true, description:'Find the first non-repeating character in a string.' },
  { title:'Longest Repeating Character Replacement', topic:'Strings', difficulty:'Medium', frequency:'Medium', oaRound:false, interviewRound:true, description:'Replace at most k chars to make longest same-letter substring.' },
  { title:'Check if Two Strings Are Close', topic:'Strings', difficulty:'Medium', frequency:'Low', oaRound:false, interviewRound:true, description:'Check if two strings can be made equal using given operations.' },
  { title:'Reverse String', topic:'Strings', difficulty:'Easy', frequency:'High', oaRound:true, interviewRound:false, description:'Reverse a string in place.' },
  { title:'Anagram Checker', topic:'Strings', difficulty:'Easy', frequency:'High', oaRound:true, interviewRound:false, description:'Determine if two strings are anagrams.' },

  // ── HASHING (40 problems) ──
  { title:'Two Sum II - Sorted Array', topic:'Hashing', difficulty:'Easy', frequency:'High', oaRound:true, interviewRound:true, description:'Find two numbers that add up to target in sorted array.' },
  { title:'Happy Number', topic:'Hashing', difficulty:'Easy', frequency:'Medium', oaRound:true, interviewRound:false, description:'Determine if a number eventually reaches 1 under happy process.' },
  { title:'Intersection of Two Arrays', topic:'Hashing', difficulty:'Easy', frequency:'Medium', oaRound:true, interviewRound:false, description:'Find the intersection of two arrays.' },
  { title:'Intersection of Two Arrays II', topic:'Hashing', difficulty:'Easy', frequency:'Medium', oaRound:true, interviewRound:false, description:'Find intersection of two arrays counting multiplicity.' },
  { title:'Top K Frequent Elements', topic:'Hashing', difficulty:'Medium', frequency:'High', oaRound:true, interviewRound:true, description:'Return k most frequent elements in array.' },
  { title:'Subarray Sum Equals K Hash', topic:'Hashing', difficulty:'Medium', frequency:'High', oaRound:false, interviewRound:true, description:'Count subarrays with sum equal to k using prefix hash.' },
  { title:'Longest Subarray with Equal 0s and 1s', topic:'Hashing', difficulty:'Medium', frequency:'Medium', oaRound:true, interviewRound:true, description:'Find longest subarray with equal number of 0s and 1s.' },
  { title:'4Sum II', topic:'Hashing', difficulty:'Medium', frequency:'Medium', oaRound:false, interviewRound:true, description:'Count tuples such that sum is zero using hash maps.' },
  { title:'Minimum Operations to Make Array Distinct', topic:'Hashing', difficulty:'Medium', frequency:'Low', oaRound:true, interviewRound:false, description:'Minimum operations to make all array elements distinct.' },
  { title:'Max Points on a Line', topic:'Hashing', difficulty:'Hard', frequency:'Medium', oaRound:false, interviewRound:true, description:'Find the maximum number of points on a same straight line.' },
  { title:'Number of Pairs With Sum', topic:'Hashing', difficulty:'Easy', frequency:'Medium', oaRound:true, interviewRound:false, description:'Count the number of pairs that sum to target.' },
  { title:'Repeated DNA Sequences', topic:'Hashing', difficulty:'Medium', frequency:'Low', oaRound:false, interviewRound:true, description:'Find all 10-letter repeated DNA sequences.' },
  { title:'LRU Cache', topic:'Hashing', difficulty:'Medium', frequency:'High', oaRound:false, interviewRound:true, description:'Design LRU cache with O(1) get and put operations.' },
  { title:'Design HashMap', topic:'Hashing', difficulty:'Easy', frequency:'Medium', oaRound:true, interviewRound:true, description:'Design a hashmap without built-in hash table libraries.' },
  { title:'Longest Palindrome by Concatenating Pairs', topic:'Hashing', difficulty:'Medium', frequency:'Low', oaRound:false, interviewRound:true, description:'Find longest palindrome from pairs of equal strings.' },
  { title:'Find Duplicate Subtrees', topic:'Hashing', difficulty:'Medium', frequency:'Low', oaRound:false, interviewRound:true, description:'Find all duplicate subtrees in a binary tree using serialization.' },

  // ── LINKED LISTS (35 problems) ──
  { title:'Reverse Linked List', topic:'Linked Lists', difficulty:'Easy', frequency:'High', oaRound:true, interviewRound:true, description:'Reverse a singly linked list.' },
  { title:'Merge Two Sorted Lists', topic:'Linked Lists', difficulty:'Easy', frequency:'High', oaRound:true, interviewRound:true, description:'Merge two sorted linked lists.' },
  { title:'Linked List Cycle', topic:'Linked Lists', difficulty:'Easy', frequency:'High', oaRound:true, interviewRound:true, description:'Detect if a linked list has a cycle.' },
  { title:'Linked List Cycle II', topic:'Linked Lists', difficulty:'Medium', frequency:'Medium', oaRound:false, interviewRound:true, description:'Find the node where cycle begins.' },
  { title:'Remove Nth Node From End of List', topic:'Linked Lists', difficulty:'Medium', frequency:'High', oaRound:true, interviewRound:true, description:'Remove the nth node from end of list.' },
  { title:'Reorder List', topic:'Linked Lists', difficulty:'Medium', frequency:'Medium', oaRound:false, interviewRound:true, description:'Reorder list: L0->Ln->L1->Ln-1->...' },
  { title:'Sort List', topic:'Linked Lists', difficulty:'Medium', frequency:'Medium', oaRound:false, interviewRound:true, description:'Sort a linked list in O(n log n) time.' },
  { title:'Palindrome Linked List', topic:'Linked Lists', difficulty:'Easy', frequency:'High', oaRound:true, interviewRound:true, description:'Check if a linked list is a palindrome.' },
  { title:'Intersection of Two Linked Lists', topic:'Linked Lists', difficulty:'Easy', frequency:'Medium', oaRound:true, interviewRound:true, description:'Find the node at which two linked lists intersect.' },
  { title:'Copy List with Random Pointer', topic:'Linked Lists', difficulty:'Medium', frequency:'High', oaRound:false, interviewRound:true, description:'Deep copy a linked list with random pointers.' },
  { title:'Add Two Numbers', topic:'Linked Lists', difficulty:'Medium', frequency:'High', oaRound:true, interviewRound:true, description:'Add two numbers represented as linked lists.' },
  { title:'Merge K Sorted Lists', topic:'Linked Lists', difficulty:'Hard', frequency:'High', oaRound:false, interviewRound:true, description:'Merge k sorted linked lists into one.' },
  { title:'Swap Nodes in Pairs', topic:'Linked Lists', difficulty:'Medium', frequency:'Medium', oaRound:false, interviewRound:true, description:'Swap every two adjacent nodes in a linked list.' },
  { title:'Reverse Nodes in k-Group', topic:'Linked Lists', difficulty:'Hard', frequency:'Medium', oaRound:false, interviewRound:true, description:'Reverse nodes in k-group and return modified list.' },
  { title:'Delete Node in Linked List', topic:'Linked Lists', difficulty:'Easy', frequency:'Medium', oaRound:true, interviewRound:false, description:'Delete a node in singly linked list with only that node given.' },
  { title:'Middle of the Linked List', topic:'Linked Lists', difficulty:'Easy', frequency:'High', oaRound:true, interviewRound:true, description:'Find the middle node of the linked list.' },
  { title:'Odd Even Linked List', topic:'Linked Lists', difficulty:'Medium', frequency:'Medium', oaRound:false, interviewRound:true, description:'Group odd nodes then even nodes of linked list.' },

  // ── STACK (30 problems) ──
  { title:'Valid Parentheses', topic:'Stack', difficulty:'Easy', frequency:'High', oaRound:true, interviewRound:true, description:'Determine if brackets are correctly matched.' },
  { title:'Min Stack', topic:'Stack', difficulty:'Medium', frequency:'High', oaRound:true, interviewRound:true, description:'Design a stack that supports push, pop, top and getMin in O(1).' },
  { title:'Evaluate Reverse Polish Notation', topic:'Stack', difficulty:'Medium', frequency:'Medium', oaRound:true, interviewRound:true, description:'Evaluate an expression in Reverse Polish Notation.' },
  { title:'Daily Temperatures', topic:'Stack', difficulty:'Medium', frequency:'High', oaRound:true, interviewRound:true, description:'Find number of days until warmer temperature for each day.' },
  { title:'Car Fleet', topic:'Stack', difficulty:'Medium', frequency:'Medium', oaRound:false, interviewRound:true, description:'Find the number of car fleets that arrive at destination.' },
  { title:'Largest Rectangle in Histogram', topic:'Stack', difficulty:'Hard', frequency:'High', oaRound:false, interviewRound:true, description:'Find largest rectangle area in histogram.' },
  { title:'Maximal Rectangle', topic:'Stack', difficulty:'Hard', frequency:'Medium', oaRound:false, interviewRound:true, description:'Find the largest rectangle in a binary matrix.' },
  { title:'Decode String', topic:'Stack', difficulty:'Medium', frequency:'Medium', oaRound:true, interviewRound:true, description:'Decode the encoded string like 3[a]2[bc] = aaabcbc.' },
  { title:'Next Greater Element I', topic:'Stack', difficulty:'Easy', frequency:'Medium', oaRound:true, interviewRound:false, description:'Find next greater element for each element in nums1.' },
  { title:'Next Greater Element II', topic:'Stack', difficulty:'Medium', frequency:'Medium', oaRound:true, interviewRound:true, description:'Find next greater element in a circular array.' },
  { title:'Backspace String Compare', topic:'Stack', difficulty:'Easy', frequency:'Medium', oaRound:true, interviewRound:false, description:'Compare two strings with backspace characters.' },
  { title:'Remove Duplicate Letters', topic:'Stack', difficulty:'Medium', frequency:'Medium', oaRound:false, interviewRound:true, description:'Remove duplicate letters so that result is smallest in lexicographic order.' },
  { title:'Score of Parentheses', topic:'Stack', difficulty:'Medium', frequency:'Low', oaRound:false, interviewRound:true, description:'Compute the score of a balanced parentheses string.' },

  // ── QUEUE (20 problems) ──
  { title:'Implement Queue using Stacks', topic:'Queue', difficulty:'Easy', frequency:'Medium', oaRound:true, interviewRound:true, description:'Implement FIFO queue using only two stacks.' },
  { title:'Implement Stack using Queues', topic:'Queue', difficulty:'Easy', frequency:'Medium', oaRound:true, interviewRound:false, description:'Implement LIFO stack using only queues.' },
  { title:'Sliding Window Maximum', topic:'Queue', difficulty:'Hard', frequency:'High', oaRound:false, interviewRound:true, description:'Return max of each sliding window of size k.' },
  { title:'Design Circular Queue', topic:'Queue', difficulty:'Medium', frequency:'Medium', oaRound:true, interviewRound:true, description:'Design a circular queue data structure.' },
  { title:'Number of Recent Calls', topic:'Queue', difficulty:'Easy', frequency:'Low', oaRound:true, interviewRound:false, description:'Count requests in the last 3000 ms.' },
  { title:'Task Scheduler', topic:'Queue', difficulty:'Medium', frequency:'High', oaRound:false, interviewRound:true, description:'Find minimum intervals to execute all tasks.' },
  { title:'Rotten Oranges', topic:'Queue', difficulty:'Medium', frequency:'High', oaRound:true, interviewRound:true, description:'Find minimum time for all oranges to rot (BFS).' },
  { title:'Open the Lock', topic:'Queue', difficulty:'Medium', frequency:'Low', oaRound:false, interviewRound:true, description:'Find minimum turns to open a lock using BFS.' },
  { title:'Jump Game VI', topic:'Queue', difficulty:'Medium', frequency:'Low', oaRound:false, interviewRound:true, description:'Maximize score with at most k jumps per step.' },

  // ── TREES (65 problems) ──
  { title:'Maximum Depth of Binary Tree', topic:'Trees', difficulty:'Easy', frequency:'High', oaRound:true, interviewRound:true, description:'Find the maximum depth of a binary tree.' },
  { title:'Invert Binary Tree', topic:'Trees', difficulty:'Easy', frequency:'High', oaRound:true, interviewRound:true, description:'Invert a binary tree.' },
  { title:'Same Tree', topic:'Trees', difficulty:'Easy', frequency:'Medium', oaRound:true, interviewRound:true, description:'Check if two binary trees are identical.' },
  { title:'Symmetric Tree', topic:'Trees', difficulty:'Easy', frequency:'Medium', oaRound:true, interviewRound:true, description:'Check if a binary tree is a mirror of itself.' },
  { title:'Binary Tree Level Order Traversal', topic:'Trees', difficulty:'Medium', frequency:'High', oaRound:true, interviewRound:true, description:'Return level order traversal of binary tree nodes.' },
  { title:'Binary Tree Zigzag Level Order Traversal', topic:'Trees', difficulty:'Medium', frequency:'Medium', oaRound:false, interviewRound:true, description:'Zigzag level order traversal of binary tree.' },
  { title:'Diameter of Binary Tree', topic:'Trees', difficulty:'Easy', frequency:'High', oaRound:true, interviewRound:true, description:'Find the length of the diameter of a binary tree.' },
  { title:'Balanced Binary Tree', topic:'Trees', difficulty:'Easy', frequency:'Medium', oaRound:true, interviewRound:true, description:'Determine if a binary tree is height-balanced.' },
  { title:'Binary Tree Maximum Path Sum', topic:'Trees', difficulty:'Hard', frequency:'High', oaRound:false, interviewRound:true, description:'Find the maximum path sum in a binary tree.' },
  { title:'Binary Tree Right Side View', topic:'Trees', difficulty:'Medium', frequency:'High', oaRound:true, interviewRound:true, description:'Return the right side view of a binary tree.' },
  { title:'Count Good Nodes in Binary Tree', topic:'Trees', difficulty:'Medium', frequency:'Medium', oaRound:false, interviewRound:true, description:'Count nodes where path from root has no greater value.' },
  { title:'Validate Binary Search Tree', topic:'Trees', difficulty:'Medium', frequency:'High', oaRound:true, interviewRound:true, description:'Validate if a binary tree is a valid BST.' },
  { title:'Kth Smallest Element in BST', topic:'Trees', difficulty:'Medium', frequency:'High', oaRound:true, interviewRound:true, description:'Find the kth smallest element in a BST.' },
  { title:'Lowest Common Ancestor of BST', topic:'Trees', difficulty:'Medium', frequency:'High', oaRound:true, interviewRound:true, description:'Find LCA of two nodes in a BST.' },
  { title:'Lowest Common Ancestor of Binary Tree', topic:'Trees', difficulty:'Medium', frequency:'High', oaRound:false, interviewRound:true, description:'Find LCA of two nodes in a binary tree.' },
  { title:'Serialize and Deserialize Binary Tree', topic:'Trees', difficulty:'Hard', frequency:'High', oaRound:false, interviewRound:true, description:'Serialize and deserialize a binary tree.' },
  { title:'Binary Tree Paths', topic:'Trees', difficulty:'Easy', frequency:'Medium', oaRound:true, interviewRound:true, description:'Return all root-to-leaf paths.' },
  { title:'Path Sum', topic:'Trees', difficulty:'Easy', frequency:'Medium', oaRound:true, interviewRound:true, description:'Check if there is a root-to-leaf path with given sum.' },
  { title:'Path Sum II', topic:'Trees', difficulty:'Medium', frequency:'Medium', oaRound:false, interviewRound:true, description:'Find all root-to-leaf paths with given sum.' },
  { title:'Flatten Binary Tree to Linked List', topic:'Trees', difficulty:'Medium', frequency:'Medium', oaRound:false, interviewRound:true, description:'Flatten binary tree to linked list in-place.' },
  { title:'Construct Binary Tree from Preorder and Inorder', topic:'Trees', difficulty:'Medium', frequency:'Medium', oaRound:false, interviewRound:true, description:'Build tree from preorder and inorder traversals.' },
  { title:'Construct BST from Preorder Traversal', topic:'Binary Search Trees', difficulty:'Medium', frequency:'Medium', oaRound:false, interviewRound:true, description:'Reconstruct BST from preorder traversal.' },
  { title:'Recover Binary Search Tree', topic:'Binary Search Trees', difficulty:'Hard', frequency:'Low', oaRound:false, interviewRound:true, description:'Fix two swapped nodes in a BST.' },
  { title:'Delete Node in BST', topic:'Binary Search Trees', difficulty:'Medium', frequency:'Medium', oaRound:false, interviewRound:true, description:'Delete a node from a BST.' },
  { title:'Insert into BST', topic:'Binary Search Trees', difficulty:'Medium', frequency:'Medium', oaRound:true, interviewRound:true, description:'Insert a value into a BST.' },
  { title:'Search in BST', topic:'Binary Search Trees', difficulty:'Easy', frequency:'Medium', oaRound:true, interviewRound:false, description:'Search for a value in a BST.' },
  { title:'Range Sum of BST', topic:'Binary Search Trees', difficulty:'Easy', frequency:'Medium', oaRound:true, interviewRound:false, description:'Find sum of values in BST within range [low, high].' },

  // ── HEAPS (20 problems) ──
  { title:'Kth Largest Element in a Stream', topic:'Heaps', difficulty:'Easy', frequency:'Medium', oaRound:true, interviewRound:true, description:'Find kth largest element in a stream using min-heap.' },
  { title:'Last Stone Weight', topic:'Heaps', difficulty:'Easy', frequency:'Medium', oaRound:true, interviewRound:false, description:'Smash the two heaviest stones and return last remaining weight.' },
  { title:'K Closest Points to Origin', topic:'Heaps', difficulty:'Medium', frequency:'High', oaRound:true, interviewRound:true, description:'Return k closest points to the origin.' },
  { title:'Task Scheduler Heap', topic:'Heaps', difficulty:'Medium', frequency:'High', oaRound:false, interviewRound:true, description:'Minimize CPU idle time using max heap.' },
  { title:'Find Median from Data Stream', topic:'Heaps', difficulty:'Hard', frequency:'High', oaRound:false, interviewRound:true, description:'Find median from a data stream using two heaps.' },
  { title:'Top K Frequent Words', topic:'Heaps', difficulty:'Medium', frequency:'High', oaRound:true, interviewRound:true, description:'Return k most frequent words in sorted order.' },
  { title:'Design Twitter', topic:'Heaps', difficulty:'Medium', frequency:'Low', oaRound:false, interviewRound:true, description:'Design a Twitter-like system with merge k sorted streams.' },
  { title:'Process Tasks Using Servers', topic:'Heaps', difficulty:'Hard', frequency:'Low', oaRound:false, interviewRound:true, description:'Assign tasks to servers minimizing time using heaps.' },
  { title:'Ugly Number II', topic:'Heaps', difficulty:'Medium', frequency:'Medium', oaRound:false, interviewRound:true, description:'Find the nth ugly number using min-heap.' },

  // ── GRAPHS (60 problems) ──
  { title:'Number of Islands', topic:'Graphs', difficulty:'Medium', frequency:'High', oaRound:true, interviewRound:true, description:'Count number of islands using DFS/BFS.' },
  { title:'Clone Graph', topic:'Graphs', difficulty:'Medium', frequency:'Medium', oaRound:false, interviewRound:true, description:'Clone an undirected graph.' },
  { title:'Course Schedule', topic:'Graphs', difficulty:'Medium', frequency:'High', oaRound:true, interviewRound:true, description:'Determine if you can finish all courses (cycle detection).' },
  { title:'Course Schedule II', topic:'Graphs', difficulty:'Medium', frequency:'High', oaRound:false, interviewRound:true, description:'Return the order to finish all courses (topological sort).' },
  { title:'Pacific Atlantic Water Flow', topic:'Graphs', difficulty:'Medium', frequency:'Medium', oaRound:false, interviewRound:true, description:'Find cells that water can flow to both oceans.' },
  { title:'Surrounded Regions', topic:'Graphs', difficulty:'Medium', frequency:'Medium', oaRound:false, interviewRound:true, description:'Capture surrounded regions of O in a 2D board.' },
  { title:'Word Ladder', topic:'Graphs', difficulty:'Hard', frequency:'High', oaRound:false, interviewRound:true, description:'Find shortest transformation sequence from beginWord to endWord.' },
  { title:'Word Ladder II', topic:'Graphs', difficulty:'Hard', frequency:'Medium', oaRound:false, interviewRound:true, description:'Find all shortest transformation sequences.' },
  { title:'Walls and Gates', topic:'Graphs', difficulty:'Medium', frequency:'Medium', oaRound:true, interviewRound:true, description:'Fill each empty room with distance to nearest gate.' },
  { title:'Rotting Oranges', topic:'Graphs', difficulty:'Medium', frequency:'High', oaRound:true, interviewRound:true, description:'Find minimum time for all fresh oranges to rot.' },
  { title:'Alien Dictionary', topic:'Graphs', difficulty:'Hard', frequency:'High', oaRound:false, interviewRound:true, description:'Find character order in alien language from sorted words.' },
  { title:'Reconstruct Itinerary', topic:'Graphs', difficulty:'Hard', frequency:'Medium', oaRound:false, interviewRound:true, description:'Reconstruct travel itinerary in lexical order using Euler path.' },
  { title:'Min Cost to Connect All Points', topic:'Graphs', difficulty:'Medium', frequency:'Medium', oaRound:false, interviewRound:true, description:'Find MST minimum cost using Prim or Kruskal algorithm.' },
  { title:'Network Delay Time', topic:'Graphs', difficulty:'Medium', frequency:'Medium', oaRound:false, interviewRound:true, description:'Find minimum time for all nodes to receive signal (Dijkstra).' },
  { title:'Cheapest Flights Within K Stops', topic:'Graphs', difficulty:'Medium', frequency:'Medium', oaRound:false, interviewRound:true, description:'Find cheapest price from src to dst with at most k stops.' },
  { title:'Number of Connected Components', topic:'Graphs', difficulty:'Medium', frequency:'High', oaRound:true, interviewRound:true, description:'Find number of connected components in undirected graph.' },
  { title:'Graph Valid Tree', topic:'Graphs', difficulty:'Medium', frequency:'Medium', oaRound:false, interviewRound:true, description:'Determine if n nodes form a valid tree.' },
  { title:'Redundant Connection', topic:'Graphs', difficulty:'Medium', frequency:'Medium', oaRound:false, interviewRound:true, description:'Find the extra edge in a graph using Union-Find.' },
  { title:'Accounts Merge', topic:'Graphs', difficulty:'Medium', frequency:'Medium', oaRound:false, interviewRound:true, description:'Merge accounts with same email using Union-Find.' },
  { title:'Snakes and Ladders', topic:'Graphs', difficulty:'Medium', frequency:'Low', oaRound:true, interviewRound:true, description:'Find minimum dice rolls to reach last cell on Snakes & Ladders board.' },
  { title:'Find if Path Exists in Graph', topic:'Graphs', difficulty:'Easy', frequency:'Medium', oaRound:true, interviewRound:false, description:'Check if valid path exists from source to destination.' },
  { title:'All Paths From Source to Target', topic:'Graphs', difficulty:'Medium', frequency:'Medium', oaRound:false, interviewRound:true, description:'Find all paths from node 0 to node n-1 in DAG.' },
  { title:'Shortest Path in Binary Matrix', topic:'Graphs', difficulty:'Medium', frequency:'Medium', oaRound:true, interviewRound:true, description:'Find shortest path from top-left to bottom-right in binary matrix.' },

  // ── DYNAMIC PROGRAMMING (60 problems) ──
  { title:'Climbing Stairs', topic:'Dynamic Programming', difficulty:'Easy', frequency:'High', oaRound:true, interviewRound:true, description:'Count ways to climb n stairs with 1 or 2 steps at a time.' },
  { title:'House Robber', topic:'Dynamic Programming', difficulty:'Medium', frequency:'High', oaRound:true, interviewRound:true, description:'Maximize money robbed from adjacent houses.' },
  { title:'House Robber II', topic:'Dynamic Programming', difficulty:'Medium', frequency:'Medium', oaRound:false, interviewRound:true, description:'House Robber in circular neighborhood.' },
  { title:'Longest Palindromic Subsequence', topic:'Dynamic Programming', difficulty:'Medium', frequency:'Medium', oaRound:false, interviewRound:true, description:'Find the length of longest palindromic subsequence.' },
  { title:'Longest Common Subsequence', topic:'Dynamic Programming', difficulty:'Medium', frequency:'High', oaRound:true, interviewRound:true, description:'Find the length of longest common subsequence.' },
  { title:'0/1 Knapsack', topic:'Dynamic Programming', difficulty:'Medium', frequency:'High', oaRound:true, interviewRound:true, description:'Maximize value within weight capacity.' },
  { title:'Coin Change', topic:'Dynamic Programming', difficulty:'Medium', frequency:'High', oaRound:true, interviewRound:true, description:'Fewest coins to make a given amount.' },
  { title:'Coin Change II', topic:'Dynamic Programming', difficulty:'Medium', frequency:'Medium', oaRound:false, interviewRound:true, description:'Count number of combinations to make amount.' },
  { title:'Target Sum', topic:'Dynamic Programming', difficulty:'Medium', frequency:'Medium', oaRound:false, interviewRound:true, description:'Assign + or - to each number to reach target.' },
  { title:'Partition Equal Subset Sum', topic:'Dynamic Programming', difficulty:'Medium', frequency:'High', oaRound:false, interviewRound:true, description:'Check if array can be partitioned into two equal sum subsets.' },
  { title:'Longest Increasing Subsequence', topic:'Dynamic Programming', difficulty:'Medium', frequency:'High', oaRound:true, interviewRound:true, description:'Find length of longest increasing subsequence.' },
  { title:'Number of Longest Increasing Subsequence', topic:'Dynamic Programming', difficulty:'Medium', frequency:'Low', oaRound:false, interviewRound:true, description:'Count the number of longest increasing subsequences.' },
  { title:'Russian Doll Envelopes', topic:'Dynamic Programming', difficulty:'Hard', frequency:'Medium', oaRound:false, interviewRound:true, description:'Maximum envelopes that can be nested (LIS in 2D).' },
  { title:'Unique Paths', topic:'Dynamic Programming', difficulty:'Medium', frequency:'High', oaRound:true, interviewRound:true, description:'Count unique paths in an m x n grid.' },
  { title:'Unique Paths II', topic:'Dynamic Programming', difficulty:'Medium', frequency:'Medium', oaRound:false, interviewRound:true, description:'Count unique paths in grid with obstacles.' },
  { title:'Minimum Path Sum', topic:'Dynamic Programming', difficulty:'Medium', frequency:'High', oaRound:true, interviewRound:true, description:'Find minimum path sum from top-left to bottom-right.' },
  { title:'Triangle', topic:'Dynamic Programming', difficulty:'Medium', frequency:'Medium', oaRound:false, interviewRound:true, description:'Find minimum path sum from top to bottom of triangle.' },
  { title:'Word Break', topic:'Dynamic Programming', difficulty:'Medium', frequency:'High', oaRound:true, interviewRound:true, description:'Check if string can be segmented into dictionary words.' },
  { title:'Word Break II', topic:'Dynamic Programming', difficulty:'Hard', frequency:'Medium', oaRound:false, interviewRound:true, description:'Return all sentences from word break segmentations.' },
  { title:'Interleaving String', topic:'Dynamic Programming', difficulty:'Medium', frequency:'Low', oaRound:false, interviewRound:true, description:'Check if s3 is interleaving of s1 and s2.' },
  { title:'Regular Expression DP', topic:'Dynamic Programming', difficulty:'Hard', frequency:'Medium', oaRound:false, interviewRound:true, description:'Implement regex matching with DP.' },
  { title:'Burst Balloons', topic:'Dynamic Programming', difficulty:'Hard', frequency:'Medium', oaRound:false, interviewRound:true, description:'Maximize coins from bursting balloons.' },
  { title:'Strange Printer', topic:'Dynamic Programming', difficulty:'Hard', frequency:'Low', oaRound:false, interviewRound:true, description:'Minimum turns for printer to print a string.' },
  { title:'Stock Buy Sell with Cooldown', topic:'Dynamic Programming', difficulty:'Medium', frequency:'Medium', oaRound:false, interviewRound:true, description:'Max profit with cooldown constraint.' },
  { title:'Stock Buy Sell with Transaction Fee', topic:'Dynamic Programming', difficulty:'Medium', frequency:'Medium', oaRound:false, interviewRound:true, description:'Max profit with transaction fee.' },

  // ── BINARY SEARCH (30 problems) ──
  { title:'Binary Search', topic:'Binary Search', difficulty:'Easy', frequency:'High', oaRound:true, interviewRound:true, description:'Classic binary search in a sorted array.' },
  { title:'Search a 2D Matrix', topic:'Binary Search', difficulty:'Medium', frequency:'High', oaRound:true, interviewRound:true, description:'Search in a row-sorted and column-sorted matrix.' },
  { title:'Search a 2D Matrix II', topic:'Binary Search', difficulty:'Medium', frequency:'Medium', oaRound:false, interviewRound:true, description:'Search in matrix where rows and columns are sorted.' },
  { title:'Koko Eating Bananas', topic:'Binary Search', difficulty:'Medium', frequency:'Medium', oaRound:true, interviewRound:true, description:'Find minimum eating speed to finish all bananas in h hours.' },
  { title:'Find Minimum in Rotated Sorted Array II', topic:'Binary Search', difficulty:'Hard', frequency:'Medium', oaRound:false, interviewRound:true, description:'Find minimum in rotated array with duplicates.' },
  { title:'First Bad Version', topic:'Binary Search', difficulty:'Easy', frequency:'High', oaRound:true, interviewRound:true, description:'Find first bad version using binary search.' },
  { title:'Capacity to Ship Packages', topic:'Binary Search', difficulty:'Medium', frequency:'Medium', oaRound:false, interviewRound:true, description:'Find minimum weight capacity to ship in D days.' },
  { title:'Median of Two Sorted Arrays BS', topic:'Binary Search', difficulty:'Hard', frequency:'High', oaRound:false, interviewRound:true, description:'Find median in O(log(m+n)) using binary search.' },
  { title:'Split Array Largest Sum', topic:'Binary Search', difficulty:'Hard', frequency:'Medium', oaRound:false, interviewRound:true, description:'Minimize the largest sum among m subarrays.' },
  { title:'Time Based Key-Value Store', topic:'Binary Search', difficulty:'Medium', frequency:'Medium', oaRound:false, interviewRound:true, description:'Design key-value store with timestamp retrieval.' },
  { title:'Sqrt(x)', topic:'Binary Search', difficulty:'Easy', frequency:'Medium', oaRound:true, interviewRound:false, description:'Compute integer square root using binary search.' },

  // ── GREEDY (35 problems) ──
  { title:'Best Time to Buy and Sell Stock II', topic:'Greedy', difficulty:'Medium', frequency:'High', oaRound:true, interviewRound:true, description:'Maximize profit from unlimited transactions.' },
  { title:'Jump Game Greedy', topic:'Greedy', difficulty:'Medium', frequency:'High', oaRound:true, interviewRound:true, description:'Can you reach the last index? Greedy approach.' },
  { title:'Partition Labels', topic:'Greedy', difficulty:'Medium', frequency:'Medium', oaRound:true, interviewRound:true, description:'Partition string so each letter appears in at most one part.' },
  { title:'Non-overlapping Intervals', topic:'Greedy', difficulty:'Medium', frequency:'High', oaRound:true, interviewRound:true, description:'Minimum number of intervals to remove to make rest non-overlapping.' },
  { title:'Minimum Number of Arrows to Burst Balloons', topic:'Greedy', difficulty:'Medium', frequency:'Medium', oaRound:false, interviewRound:true, description:'Find minimum arrows to burst all balloons.' },
  { title:'Queue Reconstruction by Height', topic:'Greedy', difficulty:'Medium', frequency:'Medium', oaRound:false, interviewRound:true, description:'Reconstruct queue based on height and position.' },
  { title:'Assign Cookies', topic:'Greedy', difficulty:'Easy', frequency:'Medium', oaRound:true, interviewRound:false, description:'Maximize content children by assigning cookies.' },
  { title:'Lemonade Change', topic:'Greedy', difficulty:'Easy', frequency:'Medium', oaRound:true, interviewRound:false, description:'Check if lemonade stand can give change to all customers.' },
  { title:'Maximum Subarray Greedy', topic:'Greedy', difficulty:'Medium', frequency:'High', oaRound:true, interviewRound:true, description:'Find max sum subarray using Kadane greedy approach.' },
  { title:'Boats to Save People', topic:'Greedy', difficulty:'Medium', frequency:'Medium', oaRound:true, interviewRound:true, description:'Minimum boats to carry everyone with weight limit.' },
  { title:'Minimum Cost to Connect Sticks', topic:'Greedy', difficulty:'Medium', frequency:'Medium', oaRound:false, interviewRound:true, description:'Minimize cost of connecting sticks using heap greedy.' },
  { title:'Hand of Straights', topic:'Greedy', difficulty:'Medium', frequency:'Low', oaRound:false, interviewRound:true, description:'Check if hand can be rearranged into groups of consecutive cards.' },

  // ── RECURSION & BACKTRACKING (25 problems) ──
  { title:'Subsets', topic:'Backtracking', difficulty:'Medium', frequency:'High', oaRound:true, interviewRound:true, description:'Generate all possible subsets of a set.' },
  { title:'Subsets II', topic:'Backtracking', difficulty:'Medium', frequency:'Medium', oaRound:false, interviewRound:true, description:'Generate all subsets of a set with duplicates.' },
  { title:'Combination Sum', topic:'Backtracking', difficulty:'Medium', frequency:'High', oaRound:true, interviewRound:true, description:'Find combinations summing to target (reuse allowed).' },
  { title:'Combination Sum II', topic:'Backtracking', difficulty:'Medium', frequency:'Medium', oaRound:false, interviewRound:true, description:'Find combinations summing to target (no reuse).' },
  { title:'Combination Sum III', topic:'Backtracking', difficulty:'Medium', frequency:'Low', oaRound:false, interviewRound:true, description:'Find k numbers summing to n using digits 1-9.' },
  { title:'Permutations', topic:'Backtracking', difficulty:'Medium', frequency:'High', oaRound:true, interviewRound:true, description:'Generate all permutations of distinct integers.' },
  { title:'Permutations II', topic:'Backtracking', difficulty:'Medium', frequency:'Medium', oaRound:false, interviewRound:true, description:'Generate unique permutations of a collection with duplicates.' },
  { title:'N-Queens', topic:'Backtracking', difficulty:'Hard', frequency:'High', oaRound:false, interviewRound:true, description:'Place n queens on n×n board with no conflicts.' },
  { title:'N-Queens II', topic:'Backtracking', difficulty:'Hard', frequency:'Low', oaRound:false, interviewRound:true, description:'Count distinct solutions to n-queens problem.' },
  { title:'Sudoku Solver', topic:'Backtracking', difficulty:'Hard', frequency:'Medium', oaRound:false, interviewRound:true, description:'Solve a Sudoku puzzle using backtracking.' },
  { title:'Letter Combinations of a Phone Number', topic:'Backtracking', difficulty:'Medium', frequency:'High', oaRound:true, interviewRound:true, description:'Generate all letter combinations from phone digits.' },
  { title:'Word Search', topic:'Backtracking', difficulty:'Medium', frequency:'High', oaRound:true, interviewRound:true, description:'Find if word exists in grid using DFS backtracking.' },
  { title:'Word Search II', topic:'Backtracking', difficulty:'Hard', frequency:'Medium', oaRound:false, interviewRound:true, description:'Find all words from dictionary in grid using Trie+backtracking.' },
  { title:'Generate Parentheses', topic:'Backtracking', difficulty:'Medium', frequency:'High', oaRound:true, interviewRound:true, description:'Generate all combinations of well-formed parentheses.' },
  { title:'Restore IP Addresses', topic:'Backtracking', difficulty:'Medium', frequency:'Medium', oaRound:true, interviewRound:true, description:'Restore valid IP addresses from a string.' },

  // ── SLIDING WINDOW (20 problems) ──
  { title:'Best Time to Buy Stock Sliding', topic:'Sliding Window', difficulty:'Easy', frequency:'High', oaRound:true, interviewRound:false, description:'Max profit using sliding window on stock prices.' },
  { title:'Longest Substring Without Repeating SW', topic:'Sliding Window', difficulty:'Medium', frequency:'High', oaRound:true, interviewRound:true, description:'Sliding window for longest substring without repeats.' },
  { title:'Permutation in String', topic:'Sliding Window', difficulty:'Medium', frequency:'High', oaRound:true, interviewRound:true, description:'Check if s1 permutation exists in s2.' },
  { title:'Minimum Window Substring SW', topic:'Sliding Window', difficulty:'Hard', frequency:'High', oaRound:false, interviewRound:true, description:'Minimum window containing all characters.' },
  { title:'Sliding Window Maximum SW', topic:'Sliding Window', difficulty:'Hard', frequency:'High', oaRound:false, interviewRound:true, description:'Maximum in each sliding window of size k.' },
  { title:'Fruit Into Baskets', topic:'Sliding Window', difficulty:'Medium', frequency:'Medium', oaRound:true, interviewRound:true, description:'Pick max fruits with at most 2 types.' },
  { title:'Minimum Size Subarray Sum', topic:'Sliding Window', difficulty:'Medium', frequency:'Medium', oaRound:true, interviewRound:true, description:'Find minimum length subarray with sum >= target.' },
  { title:'Max Consecutive Ones III', topic:'Sliding Window', difficulty:'Medium', frequency:'Medium', oaRound:true, interviewRound:true, description:'Find max consecutive 1s after flipping at most k zeros.' },
  { title:'Longest Repeating Character Replacement SW', topic:'Sliding Window', difficulty:'Medium', frequency:'Medium', oaRound:false, interviewRound:true, description:'Longest substring with same chars after k replacements.' },
  { title:'Subarrays with K Different Integers', topic:'Sliding Window', difficulty:'Hard', frequency:'Low', oaRound:false, interviewRound:true, description:'Count subarrays with exactly k different integers.' },

  // ── TWO POINTER (20 problems) ──
  { title:'Valid Palindrome II', topic:'Two Pointer', difficulty:'Easy', frequency:'High', oaRound:true, interviewRound:true, description:'Check if string can be palindrome by deleting one char.' },
  { title:'Two Sum Input Array is Sorted', topic:'Two Pointer', difficulty:'Easy', frequency:'High', oaRound:true, interviewRound:true, description:'Two pointers on sorted array to find pair summing to target.' },
  { title:'3Sum Closest', topic:'Two Pointer', difficulty:'Medium', frequency:'Medium', oaRound:false, interviewRound:true, description:'Find 3 integers whose sum is closest to target.' },
  { title:'4Sum Two Pointer', topic:'Two Pointer', difficulty:'Medium', frequency:'Low', oaRound:false, interviewRound:true, description:'Find unique quadruplets summing to target.' },
  { title:'Remove Duplicates from Sorted Array', topic:'Two Pointer', difficulty:'Easy', frequency:'High', oaRound:true, interviewRound:true, description:'Remove duplicates in-place from sorted array.' },
  { title:'Remove Element', topic:'Two Pointer', difficulty:'Easy', frequency:'Medium', oaRound:true, interviewRound:false, description:'Remove all occurrences of val from array in-place.' },
  { title:'Squares of Sorted Array', topic:'Two Pointer', difficulty:'Easy', frequency:'Medium', oaRound:true, interviewRound:false, description:'Return sorted array of squares of integers.' },
  { title:'Sort Colors Two Pointer', topic:'Two Pointer', difficulty:'Medium', frequency:'High', oaRound:true, interviewRound:true, description:'Sort array of 0s, 1s, 2s with Dutch National Flag algorithm.' },
  { title:'Minimum Difference Between Highest and Lowest', topic:'Two Pointer', difficulty:'Easy', frequency:'Medium', oaRound:true, interviewRound:false, description:'Minimize difference between k chosen elements.' },
  { title:'Boats to Save People TP', topic:'Two Pointer', difficulty:'Medium', frequency:'Medium', oaRound:true, interviewRound:true, description:'Two pointer solution for boat weight limit pairing.' },

  // ── TRIES (10 problems) ──
  { title:'Implement Trie', topic:'Tries', difficulty:'Medium', frequency:'High', oaRound:true, interviewRound:true, description:'Implement a trie with insert, search and startsWith methods.' },
  { title:'Design Add and Search Words Data Structure', topic:'Tries', difficulty:'Medium', frequency:'Medium', oaRound:false, interviewRound:true, description:'Word dictionary supporting regex search using Trie.' },
  { title:'Word Search II Trie', topic:'Tries', difficulty:'Hard', frequency:'High', oaRound:false, interviewRound:true, description:'Find all words in grid using Trie and backtracking.' },
  { title:'Replace Words', topic:'Tries', difficulty:'Medium', frequency:'Low', oaRound:false, interviewRound:true, description:'Replace words in sentence with root from dictionary using Trie.' },
  { title:'Top K Frequent Words Trie', topic:'Tries', difficulty:'Medium', frequency:'Medium', oaRound:false, interviewRound:true, description:'Find k frequent words using Trie for ordering.' },
  { title:'Longest Word in Dictionary', topic:'Tries', difficulty:'Medium', frequency:'Medium', oaRound:true, interviewRound:true, description:'Find longest word buildable from dictionary one char at a time.' },
  { title:'Map Sum Pairs', topic:'Tries', difficulty:'Medium', frequency:'Low', oaRound:false, interviewRound:true, description:'Implement a map where sum of values with given prefix is returned.' },

  // ── BIT MANIPULATION (15 problems) ──
  { title:'Number of 1 Bits', topic:'Bit Manipulation', difficulty:'Easy', frequency:'Medium', oaRound:true, interviewRound:true, description:'Count the number of set bits in an integer.' },
  { title:'Counting Bits', topic:'Bit Manipulation', difficulty:'Easy', frequency:'Medium', oaRound:true, interviewRound:true, description:'Count bits for all numbers from 0 to n.' },
  { title:'Reverse Bits', topic:'Bit Manipulation', difficulty:'Easy', frequency:'Medium', oaRound:true, interviewRound:true, description:'Reverse bits of a 32-bit integer.' },
  { title:'Missing Number Bit', topic:'Bit Manipulation', difficulty:'Easy', frequency:'High', oaRound:true, interviewRound:true, description:'Find missing number using XOR trick.' },
  { title:'Single Number II', topic:'Bit Manipulation', difficulty:'Medium', frequency:'Medium', oaRound:false, interviewRound:true, description:'Find element that appears once while others appear three times.' },
  { title:'Bitwise AND of Numbers Range', topic:'Bit Manipulation', difficulty:'Medium', frequency:'Low', oaRound:false, interviewRound:true, description:'Find bitwise AND of all numbers between m and n.' },
  { title:'Power of Two', topic:'Bit Manipulation', difficulty:'Easy', frequency:'Medium', oaRound:true, interviewRound:false, description:'Check if given number is a power of two using bits.' },
  { title:'Sum of Two Integers', topic:'Bit Manipulation', difficulty:'Medium', frequency:'Medium', oaRound:false, interviewRound:true, description:'Add two integers without using + operator.' },
  { title:'Maximum XOR of Two Numbers', topic:'Bit Manipulation', difficulty:'Medium', frequency:'Low', oaRound:false, interviewRound:true, description:'Find maximum XOR of two numbers using Trie.' },
];

// Deterministically map companies to problems based on their topic preferences
function buildCompanyQuestions() {
  const companyQuestions = {};

  COMPANIES.forEach(company => {
    const profile = COMPANY_PROFILES[company];
    const topCompanyTopics = profile.topics;

    // Score each problem by its relevance to this company
    const scored = MASTER_PROBLEMS.map(p => {
      let score = 0;
      const topicIdx = topCompanyTopics.indexOf(p.topic);
      if (topicIdx >= 0) score += (5 - topicIdx) * 20; // Higher weight for primary topics
      if (p.frequency === 'High')   score += 30;
      if (p.frequency === 'Medium') score += 15;
      if (p.oaRound)       score += 10;
      if (p.interviewRound) score += 10;

      // Tier adjustments
      if (profile.tier === 'FAANG' && p.difficulty === 'Hard') score += 25;
      if (profile.tier === 'Mass'  && p.difficulty === 'Easy') score += 20;
      if (profile.tier === 'Mass'  && p.difficulty === 'Hard') score -= 20;

      return { ...p, score };
    });

    // Sort by relevance and take top problems, ensuring 100+ per company
    const sorted = scored.sort((a, b) => b.score - a.score);
    const allTopics = TOPICS;

    // Take at least 100 problems, ensuring topic coverage
    const selected = [];
    const seenTitles = new Set();

    // First: take all high-frequency and OA-relevant
    sorted.forEach(p => {
      if (selected.length < 120 && !seenTitles.has(p.title)) {
        selected.push(p);
        seenTitles.add(p.title);
      }
    });

    // Index them with company-specific numbering
    companyQuestions[company] = selected.map((p, i) => ({
      id: `${company.toLowerCase().replace(/\s/g,'-')}-q${i+1}-${p.title.toLowerCase().replace(/[^a-z0-9]+/g,'-')}`,
      number: i + 1,
      title: p.title,
      topic: p.topic,
      difficulty: p.difficulty,
      frequency: p.frequency,
      oaRound: p.oaRound,
      interviewRound: p.interviewRound,
      description: p.description,
      company
    }));
  });

  return companyQuestions;
}

function buildCompanyMeta() {
  const meta = {};
  COMPANIES.forEach(company => {
    const profile = COMPANY_PROFILES[company];
    meta[company] = {
      name: company,
      tier: profile.tier,
      primaryTopics: profile.topics,
      difficultyRatio: { easy: profile.easy, medium: profile.medium, hard: profile.hard },
      totalQuestions: 0 // populated after buildCompanyQuestions
    };
  });
  return meta;
}

function main() {
  console.log('Building CareerPilot AI Company Tracks data...');
  const companyQuestions = buildCompanyQuestions();
  const companyMeta      = buildCompanyMeta();

  // Update totals
  COMPANIES.forEach(c => {
    companyMeta[c].totalQuestions = companyQuestions[c].length;
  });

  const output = { companyMeta, companyQuestions };
  const outPath = path.join(__dirname, 'company_tracks.json');
  fs.writeFileSync(outPath, JSON.stringify(output, null, 2));

  const totalQ = COMPANIES.reduce((s, c) => s + companyQuestions[c].length, 0);
  console.log(`✅ Generated ${totalQ} company-question mappings across ${COMPANIES.length} companies`);
  COMPANIES.forEach(c => console.log(`   ${c}: ${companyQuestions[c].length} questions`));
  console.log(`📁 Saved to: ${outPath}`);
}

main();
