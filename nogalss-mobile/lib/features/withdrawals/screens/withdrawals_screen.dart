import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../../../core/services/api_service.dart';

class WithdrawalsScreen extends StatefulWidget {
  const WithdrawalsScreen({super.key});

  @override
  State<WithdrawalsScreen> createState() => _WithdrawalsScreenState();
}

class _WithdrawalsScreenState extends State<WithdrawalsScreen> {
  final ApiService _apiService = ApiService();
  bool _isLoading = true;
  List<dynamic> _withdrawals = [];
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadWithdrawals();
  }

  Future<void> _loadWithdrawals() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final data = await _apiService.getMemberWithdrawals();
      setState(() {
        _withdrawals = List<dynamic>.from(data['withdrawals'] ?? []);
      });
    } catch (e) {
      setState(() {
        _error = 'Failed to load withdrawals: ${e.toString()}';
      });
    } finally {
      setState(() {
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('My Withdrawals'),
        backgroundColor: const Color(0xFF16A34A),
        foregroundColor: Colors.white,
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text(_error!),
                      const SizedBox(height: 16),
                      ElevatedButton(
                        onPressed: _loadWithdrawals,
                        child: const Text('Retry'),
                      ),
                    ],
                  ),
                )
              : RefreshIndicator(
                  onRefresh: _loadWithdrawals,
                  child: _withdrawals.isEmpty
                      ? const Center(
                          child: Text('No withdrawals found'),
                        )
                      : ListView.builder(
                          itemCount: _withdrawals.length,
                          itemBuilder: (context, index) {
                            final withdrawal = _withdrawals[index];
                            return Card(
                              margin: const EdgeInsets.symmetric(
                                horizontal: 16,
                                vertical: 8,
                              ),
                              child: ListTile(
                                leading: const Icon(
                                  Icons.arrow_downward,
                                  color: Colors.blue,
                                ),
                                title: Text(
                                  '₦${NumberFormat('#,##0.00').format((withdrawal['amount'] ?? 0.0).toDouble())}',
                                  style: const TextStyle(
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                                subtitle: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text('Status: ${withdrawal['status'] ?? 'Unknown'}'),
                                    if (withdrawal['bankAccount'] != null)
                                      Text('Account: ${withdrawal['bankAccount']}'),
                                    if (withdrawal['createdAt'] != null)
                                      Text(
                                        DateFormat('MMM dd, yyyy').format(
                                          DateTime.parse(withdrawal['createdAt']),
                                        ),
                                        style: const TextStyle(fontSize: 12),
                                      ),
                                  ],
                                ),
                                trailing: const Icon(Icons.chevron_right),
                              ),
                            );
                          },
                        ),
                ),
    );
  }
}
