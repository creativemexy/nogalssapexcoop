import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../../../core/services/api_service.dart';

class LoansScreen extends StatefulWidget {
  const LoansScreen({super.key});

  @override
  State<LoansScreen> createState() => _LoansScreenState();
}

class _LoansScreenState extends State<LoansScreen> {
  final ApiService _apiService = ApiService();
  bool _isLoading = true;
  List<dynamic> _loans = [];
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadLoans();
  }

  Future<void> _loadLoans() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final data = await _apiService.getMemberLoans();
      setState(() {
        _loans = List<dynamic>.from(data['loans'] ?? []);
      });
    } catch (e) {
      setState(() {
        _error = 'Failed to load loans: ${e.toString()}';
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
        title: const Text('My Loans'),
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
                        onPressed: _loadLoans,
                        child: const Text('Retry'),
                      ),
                    ],
                  ),
                )
              : RefreshIndicator(
                  onRefresh: _loadLoans,
                  child: _loans.isEmpty
                      ? const Center(
                          child: Text('No loans found'),
                        )
                      : ListView.builder(
                          itemCount: _loans.length,
                          itemBuilder: (context, index) {
                            final loan = _loans[index];
                            return Card(
                              margin: const EdgeInsets.symmetric(
                                horizontal: 16,
                                vertical: 8,
                              ),
                              child: ListTile(
                                leading: const Icon(
                                  Icons.money,
                                  color: Colors.purple,
                                ),
                                title: Text(
                                  '₦${NumberFormat('#,##0.00').format((loan['amount'] ?? 0.0).toDouble())}',
                                  style: const TextStyle(
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                                subtitle: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text('Status: ${loan['status'] ?? 'Unknown'}'),
                                    if (loan['purpose'] != null)
                                      Text('Purpose: ${loan['purpose']}'),
                                    if (loan['createdAt'] != null)
                                      Text(
                                        DateFormat('MMM dd, yyyy').format(
                                          DateTime.parse(loan['createdAt']),
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
