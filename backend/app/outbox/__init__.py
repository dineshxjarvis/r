"""Transactional outbox. Domain change, audit event and outbox row commit
atomically; consumers are idempotent and checkpointed.
"""
