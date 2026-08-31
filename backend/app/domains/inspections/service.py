"""Business logic. Commits domain change, audit event and outbox row
atomically. Never builds an HTTP response.
"""
